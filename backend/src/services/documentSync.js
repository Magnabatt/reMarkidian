const RemarkableApiClient = require('./remarkableApi');
const RemarkableConnectionService = require('./remarkableConnection');
const { runQuery, getQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class DocumentSyncService {
  constructor() {
    this.apiClient = new RemarkableApiClient();
    this.connectionService = new RemarkableConnectionService();
  }

  /**
   * Initialize the sync service with reMarkable token
   * @param {string} remarkableToken - reMarkable Cloud API token
   */
  async initialize(remarkableToken) {
    try {
      await this.apiClient.initialize(remarkableToken);
      logger.info('Document sync service initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize document sync service:', error);
      throw error;
    }
  }

  /**
   * Sync folder and file structure from reMarkable to database
   * @param {number} vaultId - Vault ID to sync documents for
   */
  async syncDocumentStructure(vaultId) {
    try {
      logger.info(`Starting document structure sync for vault ${vaultId}`);

      // Get vault information
      const vault = await getQuery('SELECT * FROM vaults WHERE id = ?', [vaultId]);
      if (!vault) {
        throw new Error(`Vault with ID ${vaultId} not found`);
      }

      // Get reMarkable token from settings
      const tokenSetting = await getQuery('SELECT value FROM settings WHERE key = ?', ['remarkable_token']);
      if (!tokenSetting || !tokenSetting.value) {
        throw new Error('reMarkable token not configured in settings');
      }

      // Initialize API client if not already done
      if (!this.apiClient.isInitialized()) {
        await this.initialize(tokenSetting.value);
      }

      // Fetch documents from reMarkable Cloud
      const rawDocuments = await this.apiClient.listDocuments();
      const { documents, hierarchy } = this.apiClient.parseDocuments(rawDocuments);

      // Sync documents to database
      const syncStats = await this.syncDocumentsToDatabase(vaultId, documents);

      logger.info(`Document structure sync completed for vault ${vaultId}:`, syncStats);
      return syncStats;

    } catch (error) {
      logger.error(`Document structure sync failed for vault ${vaultId}:`, error);
      throw error;
    }
  }

  /**
   * Sync documents to database with incremental updates
   * @param {number} vaultId - Vault ID
   * @param {Array} documents - Parsed documents from reMarkable
   */
  async syncDocumentsToDatabase(vaultId, documents) {
    const stats = {
      total: documents.length,
      new: 0,
      updated: 0,
      unchanged: 0,
      errors: 0
    };

    for (const doc of documents) {
      try {
        // Check if document already exists in database
        const existingNote = await getQuery(
          'SELECT * FROM notes WHERE vault_id = ? AND remarkable_uuid = ?',
          [vaultId, doc.uuid]
        );

        if (existingNote) {
          // Check if document needs updating
          const needsUpdate = this.needsUpdate(existingNote, doc);
          
          if (needsUpdate) {
            await this.updateDocument(vaultId, existingNote.id, doc);
            stats.updated++;
            logger.debug(`Updated document: ${doc.name} (${doc.uuid})`);
          } else {
            stats.unchanged++;
          }
        } else {
          // Insert new document
          await this.insertDocument(vaultId, doc);
          stats.new++;
          logger.debug(`Added new document: ${doc.name} (${doc.uuid})`);
        }
      } catch (error) {
        logger.error(`Error syncing document ${doc.name} (${doc.uuid}):`, error);
        stats.errors++;
      }
    }

    // Clean up deleted documents
    await this.cleanupDeletedDocuments(vaultId, documents);

    return stats;
  }

  /**
   * Check if a document needs updating based on modification time and version
   * @param {Object} existingNote - Existing note from database
   * @param {Object} doc - Document from reMarkable
   */
  needsUpdate(existingNote, doc) {
    // Check version number
    if (doc.version > existingNote.remarkable_version) {
      return true;
    }

    // Check last modified date
    if (doc.lastModified && existingNote.remarkable_last_modified) {
      const docModified = new Date(doc.lastModified);
      const existingModified = new Date(existingNote.remarkable_last_modified);
      
      if (docModified > existingModified) {
        return true;
      }
    }

    // Check if processing status needs reset (document was updated but not reprocessed)
    if (doc.lastModified && existingNote.synced_at) {
      const docModified = new Date(doc.lastModified);
      const lastSynced = new Date(existingNote.synced_at);
      
      if (docModified > lastSynced && existingNote.processed) {
        return true; // Need to reprocess
      }
    }

    return false;
  }

  /**
   * Insert new document into database
   * @param {number} vaultId - Vault ID
   * @param {Object} doc - Document from reMarkable
   */
  async insertDocument(vaultId, doc) {
    const filePath = this.generateFilePath(doc);
    const fileName = this.generateFileName(doc);

    await runQuery(`
      INSERT INTO notes (
        vault_id, remarkable_id, remarkable_uuid, file_name, visible_name,
        file_path, remarkable_last_modified, remarkable_version,
        parent_folder_id, is_folder, file_type, processed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      vaultId,
      doc.id,
      doc.uuid,
      fileName,
      doc.name,
      filePath,
      doc.lastModified ? doc.lastModified.toISOString() : null,
      doc.version,
      doc.parent,
      doc.isFolder ? 1 : 0,
      doc.fileType,
      0 // Not processed yet
    ]);
  }

  /**
   * Update existing document in database
   * @param {number} vaultId - Vault ID
   * @param {number} noteId - Note ID in database
   * @param {Object} doc - Document from reMarkable
   */
  async updateDocument(vaultId, noteId, doc) {
    const filePath = this.generateFilePath(doc);
    const fileName = this.generateFileName(doc);

    await runQuery(`
      UPDATE notes SET
        visible_name = ?,
        file_name = ?,
        file_path = ?,
        remarkable_last_modified = ?,
        remarkable_version = ?,
        parent_folder_id = ?,
        is_folder = ?,
        file_type = ?,
        processed = 0,
        synced_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      doc.name,
      fileName,
      filePath,
      doc.lastModified ? doc.lastModified.toISOString() : null,
      doc.version,
      doc.parent,
      doc.isFolder ? 1 : 0,
      doc.fileType,
      noteId
    ]);
  }

  /**
   * Generate file path for document based on hierarchy
   * @param {Object} doc - Document from reMarkable
   */
  generateFilePath(doc) {
    if (doc.isFolder) {
      return `folders/${this.sanitizeFileName(doc.name)}`;
    }
    
    // For now, put all files in root. Later we can build full hierarchy paths
    return `documents/${this.sanitizeFileName(doc.name)}.md`;
  }

  /**
   * Generate safe file name
   * @param {Object} doc - Document from reMarkable
   */
  generateFileName(doc) {
    if (doc.isFolder) {
      return this.sanitizeFileName(doc.name);
    }
    
    return `${this.sanitizeFileName(doc.name)}.md`;
  }

  /**
   * Sanitize file name for file system
   * @param {string} name - Original name
   */
  sanitizeFileName(name) {
    return name
      .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .trim();
  }

  /**
   * Clean up documents that were deleted from reMarkable
   * @param {number} vaultId - Vault ID
   * @param {Array} currentDocuments - Current documents from reMarkable
   */
  async cleanupDeletedDocuments(vaultId, currentDocuments) {
    try {
      const currentUuids = currentDocuments.map(doc => doc.uuid);
      
      if (currentUuids.length === 0) {
        return;
      }

      // Find documents in database that are no longer in reMarkable
      const placeholders = currentUuids.map(() => '?').join(',');
      const deletedNotes = await getAllQuery(`
        SELECT id, remarkable_uuid, visible_name 
        FROM notes 
        WHERE vault_id = ? AND remarkable_uuid NOT IN (${placeholders})
      `, [vaultId, ...currentUuids]);

      if (deletedNotes.length > 0) {
        // Delete the notes
        const deletePromises = deletedNotes.map(note => 
          runQuery('DELETE FROM notes WHERE id = ?', [note.id])
        );
        
        await Promise.all(deletePromises);
        
        logger.info(`Cleaned up ${deletedNotes.length} deleted documents from vault ${vaultId}`);
      }
    } catch (error) {
      logger.error('Error cleaning up deleted documents:', error);
    }
  }

  /**
   * Get unprocessed documents for a vault
   * @param {number} vaultId - Vault ID
   */
  async getUnprocessedDocuments(vaultId) {
    return await getAllQuery(`
      SELECT * FROM notes 
      WHERE vault_id = ? AND processed = 0 AND is_folder = 0
      ORDER BY remarkable_last_modified DESC
    `, [vaultId]);
  }

  /**
   * Mark document as processed
   * @param {number} noteId - Note ID
   * @param {string} fileHash - Hash of processed file
   */
  async markDocumentProcessed(noteId, fileHash = null) {
    await runQuery(`
      UPDATE notes 
      SET processed = 1, file_hash = ?, synced_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [fileHash, noteId]);
  }

  /**
   * Get sync statistics for a vault
   * @param {number} vaultId - Vault ID
   */
  async getSyncStats(vaultId) {
    const stats = await getQuery(`
      SELECT 
        COUNT(*) as total_documents,
        COUNT(CASE WHEN processed = 1 THEN 1 END) as processed_documents,
        COUNT(CASE WHEN processed = 0 THEN 1 END) as unprocessed_documents,
        COUNT(CASE WHEN is_folder = 1 THEN 1 END) as folders,
        COUNT(CASE WHEN is_folder = 0 THEN 1 END) as files,
        MAX(remarkable_last_modified) as latest_modification,
        MAX(synced_at) as last_sync
      FROM notes 
      WHERE vault_id = ?
    `, [vaultId]);

    return stats;
  }

  /**
   * Get document hierarchy for a vault
   * @param {number} vaultId - Vault ID
   */
  async getDocumentHierarchy(vaultId) {
    const documents = await getAllQuery(`
      SELECT * FROM notes 
      WHERE vault_id = ? 
      ORDER BY is_folder DESC, visible_name ASC
    `, [vaultId]);

    return this.buildDatabaseHierarchy(documents);
  }

  /**
   * Build hierarchy from database documents
   * @param {Array} documents - Documents from database
   */
  buildDatabaseHierarchy(documents) {
    const docMap = new Map();
    const roots = [];

    // Create map for quick lookup
    documents.forEach(doc => {
      docMap.set(doc.remarkable_uuid, { ...doc, children: [] });
    });

    // Build hierarchy
    documents.forEach(doc => {
      const docNode = docMap.get(doc.remarkable_uuid);
      
      if (doc.parent_folder_id && docMap.has(doc.parent_folder_id)) {
        const parent = docMap.get(doc.parent_folder_id);
        parent.children.push(docNode);
      } else {
        roots.push(docNode);
      }
    });

    return roots;
  }
}

module.exports = DocumentSyncService;
