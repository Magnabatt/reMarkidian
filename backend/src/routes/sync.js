const express = require('express');
const { runQuery, getQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');
const DocumentSyncService = require('../services/documentSync');

const router = express.Router();

// Get sync history
router.get('/history', async (req, res) => {
  try {
    const { vault_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT 
        sh.id, sh.vault_id, sh.sync_type, sh.status, sh.notes_synced,
        sh.errors_count, sh.error_message, sh.started_at, sh.completed_at,
        v.name as vault_name
      FROM sync_history sh
      LEFT JOIN vaults v ON sh.vault_id = v.id
    `;
    
    const params = [];
    
    if (vault_id) {
      query += ' WHERE sh.vault_id = ?';
      params.push(vault_id);
    }
    
    query += ' ORDER BY sh.started_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const history = await getAllQuery(query, params);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    logger.error('Error fetching sync history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync history'
    });
  }
});

// Get current sync status
router.get('/status', async (req, res) => {
  try {
    const activeSyncs = await getAllQuery(`
      SELECT 
        sh.id, sh.vault_id, sh.sync_type, sh.started_at,
        v.name as vault_name
      FROM sync_history sh
      LEFT JOIN vaults v ON sh.vault_id = v.id
      WHERE sh.status = 'in_progress'
      ORDER BY sh.started_at DESC
    `);

    const lastSyncs = await getAllQuery(`
      SELECT 
        v.id as vault_id, v.name as vault_name, v.last_sync,
        sh.status as last_sync_status, sh.notes_synced, sh.errors_count
      FROM vaults v
      LEFT JOIN sync_history sh ON v.id = sh.vault_id
      WHERE sh.id = (
        SELECT MAX(id) FROM sync_history WHERE vault_id = v.id
      )
      ORDER BY v.name
    `);

    res.json({
      success: true,
      data: {
        active_syncs: activeSyncs,
        last_syncs: lastSyncs
      }
    });
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync status'
    });
  }
});

// Start manual sync
router.post('/start', async (req, res) => {
  try {
    const { vault_id } = req.body;

    if (!vault_id) {
      return res.status(400).json({
        success: false,
        message: 'vault_id is required'
      });
    }

    // Check if vault exists
    const vault = await getQuery('SELECT * FROM vaults WHERE id = ?', [vault_id]);
    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    // Check if sync is already in progress
    const activeSync = await getQuery(`
      SELECT id FROM sync_history 
      WHERE vault_id = ? AND status = 'in_progress'
    `, [vault_id]);

    if (activeSync) {
      return res.status(409).json({
        success: false,
        message: 'Sync already in progress for this vault'
      });
    }

    // Create sync history record
    const syncResult = await runQuery(`
      INSERT INTO sync_history (vault_id, sync_type, status)
      VALUES (?, 'manual', 'in_progress')
    `, [vault_id]);

    logger.sync(`Manual sync started for vault: ${vault.name}`, { 
      vaultId: vault_id, 
      syncId: syncResult.id 
    });

    // Start the actual sync process asynchronously
    performDocumentSync(vault_id, syncResult.id, vault.name);

    res.json({
      success: true,
      message: 'Sync started successfully',
      data: { sync_id: syncResult.id }
    });
  } catch (error) {
    logger.error('Error starting sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start sync'
    });
  }
});

// Stop sync
router.post('/stop/:syncId', async (req, res) => {
  try {
    const { syncId } = req.params;

    const sync = await getQuery(`
      SELECT sh.*, v.name as vault_name
      FROM sync_history sh
      LEFT JOIN vaults v ON sh.vault_id = v.id
      WHERE sh.id = ?
    `, [syncId]);

    if (!sync) {
      return res.status(404).json({
        success: false,
        message: 'Sync not found'
      });
    }

    if (sync.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Sync is not in progress'
      });
    }

    await runQuery(`
      UPDATE sync_history 
      SET status = 'error', error_message = 'Manually stopped', completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [syncId]);

    logger.sync(`Sync stopped manually for vault: ${sync.vault_name}`, { 
      vaultId: sync.vault_id, 
      syncId 
    });

    res.json({
      success: true,
      message: 'Sync stopped successfully'
    });
  } catch (error) {
    logger.error('Error stopping sync:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop sync'
    });
  }
});

// Get sync statistics for a vault
router.get('/stats/:vaultId', async (req, res) => {
  try {
    const { vaultId } = req.params;

    const syncService = new DocumentSyncService();
    const stats = await syncService.getSyncStats(vaultId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching sync stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sync statistics'
    });
  }
});

// Get document hierarchy for a vault
router.get('/documents/:vaultId', async (req, res) => {
  try {
    const { vaultId } = req.params;

    const syncService = new DocumentSyncService();
    const hierarchy = await syncService.getDocumentHierarchy(vaultId);

    res.json({
      success: true,
      data: hierarchy
    });
  } catch (error) {
    logger.error('Error fetching document hierarchy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch document hierarchy'
    });
  }
});

// Get unprocessed documents for a vault
router.get('/unprocessed/:vaultId', async (req, res) => {
  try {
    const { vaultId } = req.params;

    const syncService = new DocumentSyncService();
    const unprocessed = await syncService.getUnprocessedDocuments(vaultId);

    res.json({
      success: true,
      data: unprocessed
    });
  } catch (error) {
    logger.error('Error fetching unprocessed documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unprocessed documents'
    });
  }
});

/**
 * Perform document sync asynchronously
 * @param {number} vaultId - Vault ID
 * @param {number} syncId - Sync history ID
 * @param {string} vaultName - Vault name for logging
 */
async function performDocumentSync(vaultId, syncId, vaultName) {
  const syncService = new DocumentSyncService();
  
  try {
    // Sync document structure from reMarkable
    const syncStats = await syncService.syncDocumentStructure(vaultId);

    // Update sync history with success
    await runQuery(`
      UPDATE sync_history 
      SET status = 'success', 
          notes_synced = ?, 
          errors_count = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [syncStats.new + syncStats.updated, syncStats.errors, syncId]);

    // Update vault last sync time
    await runQuery(`
      UPDATE vaults 
      SET last_sync = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [vaultId]);

    logger.sync(`Document sync completed for vault: ${vaultName}`, { 
      vaultId, 
      syncId,
      stats: syncStats
    });

  } catch (error) {
    logger.error(`Document sync failed for vault: ${vaultName}`, error);

    // Update sync history with error
    await runQuery(`
      UPDATE sync_history 
      SET status = 'error', 
          error_message = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [error.message, syncId]);
  }
}

module.exports = router;
