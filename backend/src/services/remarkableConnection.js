const RemarkableApiClient = require('./remarkableApi');
const tokenSecurity = require('./tokenSecurity');
const { runQuery, getQuery } = require('../config/database');
const logger = require('../utils/logger');

class RemarkableConnectionService {
  constructor() {
    this.apiClient = new RemarkableApiClient();
  }

  /**
   * Connect to reMarkable using one-time code
   * @param {string} oneTimeCode - One-time code from reMarkable
   * @returns {Object} - Connection result
   */
  async connect(oneTimeCode) {
    try {
      logger.info('Attempting reMarkable connection with one-time code');

      // Validate one-time code format
      if (!this.validateOneTimeCode(oneTimeCode)) {
        throw new Error('Invalid one-time code format');
      }

      // Initialize API client with the one-time code
      await this.apiClient.initialize(oneTimeCode);

      // Get device and user tokens
      const deviceToken = this.apiClient.deviceToken;
      const userToken = await this.apiClient.getUserToken();

      if (!deviceToken || !userToken) {
        throw new Error('Failed to obtain authentication tokens');
      }

      // Encrypt tokens before storing
      const encryptedDeviceToken = tokenSecurity.encrypt(deviceToken);
      const encryptedUserToken = tokenSecurity.encrypt(userToken);

      // Store encrypted tokens in database
      await this.storeTokens(encryptedDeviceToken, encryptedUserToken);

      // Test the connection
      const connectionTest = await this.testConnection();
      
      if (!connectionTest.success) {
        throw new Error('Connection test failed after token storage');
      }

      logger.info('reMarkable connection established successfully');

      return {
        success: true,
        message: 'Successfully connected to reMarkable Cloud',
        connectionStatus: 'connected',
        deviceId: this.apiClient.deviceId,
        testResult: connectionTest
      };

    } catch (error) {
      logger.error('reMarkable connection failed:', error);
      
      // Clean up any partial tokens on failure
      await this.disconnect();

      return {
        success: false,
        message: error.message || 'Failed to connect to reMarkable Cloud',
        connectionStatus: 'disconnected',
        error: error.message
      };
    }
  }

  /**
   * Test current reMarkable connection
   * @returns {Object} - Test result
   */
  async testConnection() {
    try {
      logger.info('Testing reMarkable connection');

      // Get stored tokens
      const tokens = await this.getStoredTokens();
      if (!tokens.deviceToken || !tokens.userToken) {
        return {
          success: false,
          message: 'No stored tokens found',
          connectionStatus: 'disconnected'
        };
      }

      // Initialize API client with stored tokens
      this.apiClient.deviceToken = tokens.deviceToken;
      this.apiClient.userToken = tokens.userToken;

      // Test by fetching document list
      const documents = await this.apiClient.listDocuments();
      
      logger.info(`Connection test successful - found ${documents.length} documents`);

      return {
        success: true,
        message: 'Connection test successful',
        connectionStatus: 'connected',
        documentCount: documents.length,
        lastTested: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Connection test failed:', error);

      return {
        success: false,
        message: error.message || 'Connection test failed',
        connectionStatus: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get current connection status
   * @returns {Object} - Connection status
   */
  async getConnectionStatus() {
    try {
      const tokens = await this.getStoredTokens();
      
      if (!tokens.deviceToken || !tokens.userToken) {
        return {
          connectionStatus: 'disconnected',
          message: 'No reMarkable tokens configured',
          hasTokens: false
        };
      }

      // Get last sync information
      const lastSync = await getQuery(`
        SELECT MAX(completed_at) as last_sync_time, 
               COUNT(*) as total_syncs,
               SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful_syncs
        FROM sync_history
      `);

      return {
        connectionStatus: 'connected',
        message: 'reMarkable tokens configured',
        hasTokens: true,
        lastSync: lastSync?.last_sync_time || null,
        totalSyncs: lastSync?.total_syncs || 0,
        successfulSyncs: lastSync?.successful_syncs || 0
      };

    } catch (error) {
      logger.error('Error getting connection status:', error);
      
      return {
        connectionStatus: 'error',
        message: 'Error checking connection status',
        hasTokens: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect from reMarkable (clear tokens)
   * @returns {Object} - Disconnect result
   */
  async disconnect() {
    try {
      logger.info('Disconnecting from reMarkable');

      // Clear tokens from database
      await runQuery(`
        UPDATE settings 
        SET value = '', updated_at = CURRENT_TIMESTAMP
        WHERE key IN ('remarkable_device_token', 'remarkable_user_token')
      `);

      // Clear API client tokens
      this.apiClient.deviceToken = null;
      this.apiClient.userToken = null;
      this.apiClient.deviceId = null;

      logger.info('Successfully disconnected from reMarkable');

      return {
        success: true,
        message: 'Successfully disconnected from reMarkable Cloud',
        connectionStatus: 'disconnected'
      };

    } catch (error) {
      logger.error('Error disconnecting from reMarkable:', error);
      
      return {
        success: false,
        message: 'Error disconnecting from reMarkable Cloud',
        error: error.message
      };
    }
  }

  /**
   * Store encrypted tokens in database
   * @param {string} encryptedDeviceToken - Encrypted device token
   * @param {string} encryptedUserToken - Encrypted user token
   */
  async storeTokens(encryptedDeviceToken, encryptedUserToken) {
    // Store device token
    await runQuery(`
      INSERT OR REPLACE INTO settings (key, value, type, description, updated_at)
      VALUES ('remarkable_device_token', ?, 'string', 'Encrypted reMarkable device token', CURRENT_TIMESTAMP)
    `, [encryptedDeviceToken]);

    // Store user token
    await runQuery(`
      INSERT OR REPLACE INTO settings (key, value, type, description, updated_at)
      VALUES ('remarkable_user_token', ?, 'string', 'Encrypted reMarkable user token', CURRENT_TIMESTAMP)
    `, [encryptedUserToken]);

    // Update the legacy remarkable_token setting to indicate tokens are stored
    await runQuery(`
      UPDATE settings 
      SET value = 'configured', updated_at = CURRENT_TIMESTAMP
      WHERE key = 'remarkable_token'
    `);
  }

  /**
   * Get and decrypt stored tokens
   * @returns {Object} - Decrypted tokens
   */
  async getStoredTokens() {
    try {
      const deviceTokenSetting = await getQuery(`
        SELECT value FROM settings WHERE key = 'remarkable_device_token'
      `);

      const userTokenSetting = await getQuery(`
        SELECT value FROM settings WHERE key = 'remarkable_user_token'
      `);

      if (!deviceTokenSetting?.value || !userTokenSetting?.value) {
        return { deviceToken: null, userToken: null };
      }

      // Decrypt tokens
      const deviceToken = tokenSecurity.decrypt(deviceTokenSetting.value);
      const userToken = tokenSecurity.decrypt(userTokenSetting.value);

      return { deviceToken, userToken };

    } catch (error) {
      logger.error('Error retrieving stored tokens:', error);
      return { deviceToken: null, userToken: null };
    }
  }

  /**
   * Validate one-time code format
   * @param {string} code - One-time code to validate
   * @returns {boolean} - True if valid format
   */
  validateOneTimeCode(code) {
    if (!code || typeof code !== 'string') {
      return false;
    }

    // Remove whitespace and convert to lowercase
    const cleanCode = code.trim().toLowerCase();

    // reMarkable one-time codes are typically 8 characters, alphanumeric
    const codeRegex = /^[a-z0-9]{8}$/;
    
    return codeRegex.test(cleanCode);
  }

  /**
   * Get API client instance (for use by other services)
   * @returns {RemarkableApiClient} - API client instance
   */
  getApiClient() {
    return this.apiClient;
  }

  /**
   * Initialize API client with stored tokens
   * @returns {boolean} - True if successfully initialized
   */
  async initializeWithStoredTokens() {
    try {
      const tokens = await this.getStoredTokens();
      
      if (!tokens.deviceToken || !tokens.userToken) {
        return false;
      }

      this.apiClient.deviceToken = tokens.deviceToken;
      this.apiClient.userToken = tokens.userToken;

      return true;
    } catch (error) {
      logger.error('Error initializing API client with stored tokens:', error);
      return false;
    }
  }
}

module.exports = RemarkableConnectionService;
