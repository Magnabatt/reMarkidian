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
      logger.info('Attempting reMarkable device registration with one-time code');

      // Validate one-time code format
      if (!this.validateOneTimeCode(oneTimeCode)) {
        throw new Error('Invalid one-time code format');
      }

      // Ensure device ID is set
      await this.apiClient.getDeviceId();

      // Register device with the one-time code
      const registrationResult = await this.apiClient.registerDevice(oneTimeCode);

      if (!registrationResult.deviceToken) {
        throw new Error('Failed to obtain device token');
      }

      // Encrypt device token before storing
      const encryptedDeviceToken = tokenSecurity.encrypt(registrationResult.deviceToken);

      // Store encrypted device token in database
      await this.storeDeviceToken(encryptedDeviceToken);

      logger.info('reMarkable device registered successfully');

      return {
        success: true,
        message: 'Successfully registered device with reMarkable Cloud',
        connectionStatus: 'registered',
        deviceId: registrationResult.deviceId,
        registeredAt: registrationResult.registeredAt,
        deviceDesc: registrationResult.deviceDesc
      };

    } catch (error) {
      logger.error('reMarkable device registration failed:', error);
      
      // Clean up any partial tokens on failure
      await this.disconnect();

      return {
        success: false,
        message: error.message || 'Failed to register device with reMarkable Cloud',
        connectionStatus: 'disconnected',
        error: error.message
      };
    }
  }

  /**
   * Refresh the stored device token
   * @returns {Object} - Refresh result
   */
  async refreshToken() {
    try {
      logger.info('Attempting to refresh device token');

      // Get current stored token
      const currentToken = await this.getStoredDeviceToken();
      if (!currentToken) {
        throw new Error('No device token found to refresh');
      }

      // Refresh the token using the API client
      const newToken = await this.apiClient.refreshToken(currentToken);

      if (!newToken) {
        throw new Error('Failed to obtain refreshed token');
      }

      // Encrypt and store the new token
      const encryptedNewToken = tokenSecurity.encrypt(newToken);
      await this.storeDeviceToken(encryptedNewToken);

      logger.info('Device token refreshed and stored successfully');

      return {
        success: true,
        message: 'Device token refreshed successfully',
        oldToken: currentToken.substring(0, 8) + '...' + currentToken.substring(currentToken.length - 8),
        newToken: newToken.substring(0, 8) + '...' + newToken.substring(newToken.length - 8),
        refreshedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Device token refresh failed:', error);
      
      return {
        success: false,
        message: error.message || 'Failed to refresh device token',
        error: error.message
      };
    }
  }

  /**
   * Get current device registration status
   * @returns {Object} - Registration status
   */
  async getConnectionStatus() {
    try {
      const deviceToken = await this.getStoredDeviceToken();
      
      if (!deviceToken) {
        return {
          connectionStatus: 'disconnected',
          message: 'No reMarkable device registered',
          hasDeviceToken: false
        };
      }

      // Get device ID from database
      const deviceIdSetting = await getQuery(`
        SELECT value FROM settings WHERE key = 'remarkable_device_id'
      `);

      return {
        connectionStatus: 'registered',
        message: 'Device registered with reMarkable Cloud',
        hasDeviceToken: true,
        deviceId: deviceIdSetting?.value || null,
        deviceToken: deviceToken.substring(0, 8) + '...' + deviceToken.substring(deviceToken.length - 8) // Show partial token for testing
      };

    } catch (error) {
      logger.error('Error getting device registration status:', error);
      
      return {
        connectionStatus: 'error',
        message: 'Error checking device registration status',
        hasDeviceToken: false,
        error: error.message
      };
    }
  }

  /**
   * Disconnect from reMarkable (clear device token)
   * @returns {Object} - Disconnect result
   */
  async disconnect() {
    try {
      logger.info('Clearing reMarkable device registration');

      // Clear device token from database
      await runQuery(`
        UPDATE settings 
        SET value = '', updated_at = CURRENT_TIMESTAMP
        WHERE key = 'remarkable_device_token'
      `);

      // Clear API client tokens
      this.apiClient.deviceToken = null;
      this.apiClient.deviceId = null;

      logger.info('Successfully cleared device registration');

      return {
        success: true,
        message: 'Device registration cleared locally. To remove the device from your reMarkable account, visit https://my.remarkable.com/device/',
        connectionStatus: 'disconnected'
      };

    } catch (error) {
      logger.error('Error clearing device registration:', error);
      
      return {
        success: false,
        message: 'Error clearing device registration',
        error: error.message
      };
    }
  }

  /**
   * Store encrypted device token in database
   * @param {string} encryptedDeviceToken - Encrypted device token
   */
  async storeDeviceToken(encryptedDeviceToken) {
    await runQuery(`
      INSERT OR REPLACE INTO settings (key, value, type, description, updated_at)
      VALUES ('remarkable_device_token', ?, 'string', 'Encrypted reMarkable device token', CURRENT_TIMESTAMP)
    `, [encryptedDeviceToken]);

    // Update the legacy remarkable_token setting to indicate device is registered
    await runQuery(`
      UPDATE settings 
      SET value = 'registered', updated_at = CURRENT_TIMESTAMP
      WHERE key = 'remarkable_token'
    `);
  }

  /**
   * Get and decrypt stored device token
   * @returns {string|null} - Decrypted device token
   */
  async getStoredDeviceToken() {
    try {
      const deviceTokenSetting = await getQuery(`
        SELECT value FROM settings WHERE key = 'remarkable_device_token'
      `);

      if (!deviceTokenSetting?.value) {
        return null;
      }

      // Decrypt token
      const deviceToken = tokenSecurity.decrypt(deviceTokenSetting.value);
      return deviceToken;

    } catch (error) {
      logger.error('Error retrieving stored device token:', error);
      return null;
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

}

module.exports = RemarkableConnectionService;
