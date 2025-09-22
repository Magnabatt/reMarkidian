const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

class RemarkableApiClient {
  constructor() {
    this.baseUrl = 'https://document-storage-production-dot-remarkable-cloud.appspot.com';
    this.authUrl = 'https://webapp-production-dot-remarkable-cloud.appspot.com';
    this.userToken = null;
    this.deviceToken = null;
    this.deviceId = null;
  }

  /**
   * Initialize the API client with authentication
   * @param {string} userToken - User authentication token
   */
  async initialize(userToken) {
    try {
      this.userToken = userToken;
      
      // Generate a unique device ID for this instance
      this.deviceId = uuidv4();
      
      // Register device and get device token
      await this.registerDevice();
      
      logger.info('reMarkable API client initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize reMarkable API client:', error);
      throw error;
    }
  }

  /**
   * Register device with reMarkable Cloud
   */
  async registerDevice() {
    try {
      const response = await axios.post(`${this.authUrl}/token/json/2/device/new`, {
        code: this.userToken,
        deviceDesc: 'reMarkidian Sync Client',
        deviceID: this.deviceId
      }, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      this.deviceToken = response.data;
      logger.info('Device registered successfully with reMarkable Cloud');
      
      return this.deviceToken;
    } catch (error) {
      logger.error('Device registration failed:', error.response?.data || error.message);
      throw new Error(`Device registration failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get user token for API access
   */
  async getUserToken() {
    try {
      if (!this.deviceToken) {
        throw new Error('Device not registered. Call registerDevice() first.');
      }

      const response = await axios.post(`${this.authUrl}/token/json/2/user/new`, {}, {
        headers: {
          'Authorization': `Bearer ${this.deviceToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      const apiToken = response.data;
      logger.info('User token obtained successfully');
      
      return apiToken;
    } catch (error) {
      logger.error('Failed to get user token:', error.response?.data || error.message);
      throw new Error(`Failed to get user token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * List all documents and folders from reMarkable Cloud
   */
  async listDocuments() {
    try {
      const userToken = await this.getUserToken();
      
      const response = await axios.get(`${this.baseUrl}/document-storage/json/2/docs`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      const documents = response.data;
      logger.info(`Retrieved ${documents.length} documents from reMarkable Cloud`);
      
      return documents;
    } catch (error) {
      logger.error('Failed to list documents:', error.response?.data || error.message);
      throw new Error(`Failed to list documents: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get document metadata by ID
   * @param {string} documentId - Document UUID
   */
  async getDocumentMetadata(documentId) {
    try {
      const userToken = await this.getUserToken();
      
      const response = await axios.get(`${this.baseUrl}/document-storage/json/2/docs/${documentId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      return response.data;
    } catch (error) {
      logger.error(`Failed to get metadata for document ${documentId}:`, error.response?.data || error.message);
      throw new Error(`Failed to get document metadata: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Download document files
   * @param {string} documentId - Document UUID
   * @param {string} fileType - File type to download (e.g., 'rm', 'pdf', 'epub')
   */
  async downloadDocument(documentId, fileType = 'rm') {
    try {
      const userToken = await this.getUserToken();
      
      // First, get the download URL
      const urlResponse = await axios.get(`${this.baseUrl}/document-storage/json/2/docs/${documentId}/download-url`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      const downloadUrl = urlResponse.data.url;
      
      // Download the actual file
      const fileResponse = await axios.get(downloadUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'reMarkidian/1.0.0'
        }
      });

      logger.info(`Downloaded document ${documentId} (${fileType})`);
      return fileResponse.data;
    } catch (error) {
      logger.error(`Failed to download document ${documentId}:`, error.response?.data || error.message);
      throw new Error(`Failed to download document: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Parse document list into a structured format
   * @param {Array} documents - Raw document list from API
   */
  parseDocuments(documents) {
    const parsed = documents.map(doc => ({
      id: doc.ID,
      uuid: doc.ID,
      name: doc.VissibleName || doc.ID,
      type: doc.Type, // 'DocumentType' or 'CollectionType'
      parent: doc.Parent || null,
      version: doc.Version || 1,
      lastModified: doc.ModifiedClient ? new Date(doc.ModifiedClient) : null,
      isFolder: doc.Type === 'CollectionType',
      fileType: this.getFileType(doc),
      bookmarked: doc.Bookmarked || false,
      currentPage: doc.CurrentPage || 0,
      success: doc.Success || true
    }));

    // Build hierarchy
    const hierarchy = this.buildHierarchy(parsed);
    
    logger.info(`Parsed ${parsed.length} documents into hierarchy`);
    return { documents: parsed, hierarchy };
  }

  /**
   * Determine file type from document metadata
   * @param {Object} doc - Document metadata
   */
  getFileType(doc) {
    if (doc.Type === 'CollectionType') {
      return 'folder';
    }
    
    // Check for file extension in the name
    const name = doc.VissibleName || '';
    if (name.endsWith('.pdf')) return 'pdf';
    if (name.endsWith('.epub')) return 'epub';
    
    // Default to reMarkable format
    return 'rm';
  }

  /**
   * Build hierarchical structure from flat document list
   * @param {Array} documents - Parsed documents
   */
  buildHierarchy(documents) {
    const docMap = new Map();
    const roots = [];

    // Create a map for quick lookup
    documents.forEach(doc => {
      docMap.set(doc.id, { ...doc, children: [] });
    });

    // Build the hierarchy
    documents.forEach(doc => {
      const docNode = docMap.get(doc.id);
      
      if (doc.parent && docMap.has(doc.parent)) {
        // Add to parent's children
        const parent = docMap.get(doc.parent);
        parent.children.push(docNode);
      } else {
        // Root level document
        roots.push(docNode);
      }
    });

    return roots;
  }

  /**
   * Check if the API client is properly initialized
   */
  isInitialized() {
    return this.userToken !== null;
  }

  /**
   * Get API status and connection info
   */
  getStatus() {
    return {
      initialized: this.isInitialized(),
      hasDeviceToken: this.deviceToken !== null,
      deviceId: this.deviceId,
      baseUrl: this.baseUrl
    };
  }
}

module.exports = RemarkableApiClient;
