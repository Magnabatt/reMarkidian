const crypto = require('crypto');
const logger = require('../utils/logger');

class TokenSecurity {
  constructor() {
    // Use environment variable or generate a default key (not recommended for production)
    this.encryptionKey = process.env.ENCRYPTION_KEY || 'remarkidian-default-key-change-in-production';
    this.algorithm = 'aes-256-cbc';
    
    // Ensure key is 32 bytes for AES-256
    this.key = crypto.scryptSync(this.encryptionKey, 'salt', 32);
  }

  /**
   * Encrypt sensitive token data
   * @param {string} text - Text to encrypt
   * @returns {string} - Encrypted text with IV prepended
   */
  encrypt(text) {
    try {
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text to encrypt');
      }

      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(this.algorithm, this.key);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      logger.error('Token encryption failed:', error);
      throw new Error('Failed to encrypt token');
    }
  }

  /**
   * Decrypt sensitive token data
   * @param {string} encryptedText - Encrypted text with IV prepended
   * @returns {string} - Decrypted text
   */
  decrypt(encryptedText) {
    try {
      if (!encryptedText || typeof encryptedText !== 'string') {
        throw new Error('Invalid encrypted text');
      }

      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted text format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(this.algorithm, this.key);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      logger.error('Token decryption failed:', error);
      throw new Error('Failed to decrypt token');
    }
  }

  /**
   * Hash token for comparison without storing the actual token
   * @param {string} token - Token to hash
   * @returns {string} - Hashed token
   */
  hashToken(token) {
    try {
      return crypto.createHash('sha256').update(token).digest('hex');
    } catch (error) {
      logger.error('Token hashing failed:', error);
      throw new Error('Failed to hash token');
    }
  }

  /**
   * Generate a secure random token
   * @param {number} length - Length of token in bytes (default: 32)
   * @returns {string} - Random token
   */
  generateSecureToken(length = 32) {
    try {
      return crypto.randomBytes(length).toString('hex');
    } catch (error) {
      logger.error('Token generation failed:', error);
      throw new Error('Failed to generate secure token');
    }
  }

  /**
   * Validate if a string appears to be encrypted by this service
   * @param {string} text - Text to validate
   * @returns {boolean} - True if appears to be encrypted
   */
  isEncrypted(text) {
    if (!text || typeof text !== 'string') {
      return false;
    }
    
    // Check if it has the IV:encrypted format
    const parts = text.split(':');
    return parts.length === 2 && parts[0].length === 32; // IV is 16 bytes = 32 hex chars
  }
}

module.exports = new TokenSecurity();
