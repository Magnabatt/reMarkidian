const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { getQuery, runQuery } = require('../config/database');
const logger = require('../utils/logger');

class RemarkableApiClient {
  constructor() {
    this.deviceAuthUrl = 'https://webapp.cloud.remarkable.com';
    this.deviceToken = null;
    this.deviceId = null;
  }

  /**
   * Get or create persistent device ID
   */
  async getDeviceId() {
    try {
      // Try to get existing device ID from database
      const setting = await getQuery('SELECT value FROM settings WHERE key = ?', ['remarkable_device_id']);
      
      if (setting && setting.value) {
        this.deviceId = setting.value;
        logger.info('Using existing device ID from database');
        return this.deviceId;
      }

      // Generate new device ID and store it
      this.deviceId = uuidv4();
      await runQuery(`
        INSERT OR REPLACE INTO settings (key, value, type, description, updated_at)
        VALUES (?, ?, 'string', 'Persistent reMarkable device ID', CURRENT_TIMESTAMP)
      `, ['remarkable_device_id', this.deviceId]);

      logger.info('Generated and stored new device ID');
      return this.deviceId;
    } catch (error) {
      logger.error('Failed to get/create device ID:', error);
      // Fallback to temporary device ID
      this.deviceId = uuidv4();
      return this.deviceId;
    }
  }

  /**
   * Register device with reMarkable Cloud using one-time code
   * @param {string} oneTimeCode - One-time code from reMarkable
   */
  async registerDevice(oneTimeCode) {
    try {
      // Ensure we have a device ID
      if (!this.deviceId) {
        await this.getDeviceId();
      }

      // Use the correct payload format as specified
      const payload = {
        code: oneTimeCode,
        deviceDesc: 'desktop-windows',
        deviceID: this.deviceId
      };

      logger.info('Registering device with reMarkable Cloud', {
        deviceID: this.deviceId,
        deviceDesc: payload.deviceDesc,
        codeLength: oneTimeCode.length
      });

      const response = await axios.post(`${this.deviceAuthUrl}/token/json/2/device/new`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.deviceToken = response.data;
      logger.info('Device registered successfully with reMarkable Cloud');
      
      return {
        deviceToken: this.deviceToken,
        deviceId: this.deviceId,
        registeredAt: new Date().toISOString(),
        deviceDesc: payload.deviceDesc
      };
    } catch (error) {
      logger.error('Device registration failed:', error.response?.data || error.message);
      throw new Error(`Device registration failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Refresh device token to get a new one
   * @param {string} currentToken - Current device token to refresh
   * @returns {string} - New refreshed token
   */
  async refreshToken(currentToken) {
    try {
      if (!currentToken) {
        throw new Error('No token provided for refresh');
      }

      logger.info('Refreshing device token');

      const response = await axios.post('https://my.remarkable.com/token/json/2/user/new', {}, {
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      });

      const refreshedToken = response.data;
      logger.info('Device token refreshed successfully');
      
      return refreshedToken;
    } catch (error) {
      logger.error('Failed to refresh device token:', error.response?.data || error.message);
      throw new Error(`Failed to refresh device token: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Get device registration status
   */
  getStatus() {
    return {
      hasDeviceToken: this.deviceToken !== null,
      deviceId: this.deviceId,
      registrationUrl: this.deviceAuthUrl
    };
  }
}

module.exports = RemarkableApiClient;
