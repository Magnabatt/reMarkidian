const { runQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');

class AppLoggerService {
  /**
   * Log an application event to the database
   * @param {string} level - Log level (error, warn, info, debug)
   * @param {string} category - Category (sync, auth, api, system)
   * @param {string} message - Log message
   * @param {Object} metadata - Additional metadata
   * @param {string} source - Source of the log (optional)
   */
  static async log(level, category, message, metadata = {}, source = 'backend') {
    try {
      await runQuery(`
        INSERT INTO app_logs (level, category, message, metadata, source, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        level,
        category,
        message,
        JSON.stringify(metadata),
        source
      ]);

      // Also log to console for development
      logger[level] ? logger[level](message, metadata) : logger.info(message, metadata);
    } catch (error) {
      // Fallback to console logging if database logging fails
      logger.error('Failed to log to database:', error);
      logger[level] ? logger[level](message, metadata) : logger.info(message, metadata);
    }
  }

  /**
   * Log an error
   */
  static async error(category, message, metadata = {}, source = 'backend') {
    return this.log('error', category, message, metadata, source);
  }

  /**
   * Log a warning
   */
  static async warn(category, message, metadata = {}, source = 'backend') {
    return this.log('warn', category, message, metadata, source);
  }

  /**
   * Log an info message
   */
  static async info(category, message, metadata = {}, source = 'backend') {
    return this.log('info', category, message, metadata, source);
  }

  /**
   * Log a debug message
   */
  static async debug(category, message, metadata = {}, source = 'backend') {
    return this.log('debug', category, message, metadata, source);
  }

  /**
   * Get application logs with filtering
   * @param {Object} filters - Filtering options
   * @returns {Array} - Array of log entries
   */
  static async getLogs(filters = {}) {
    try {
      let query = `
        SELECT id, level, category, message, metadata, source, created_at
        FROM app_logs
        WHERE 1=1
      `;
      const params = [];

      // Add filters
      if (filters.level) {
        query += ` AND level = ?`;
        params.push(filters.level);
      }

      if (filters.category) {
        query += ` AND category = ?`;
        params.push(filters.category);
      }

      if (filters.source) {
        query += ` AND source = ?`;
        params.push(filters.source);
      }

      if (filters.since) {
        query += ` AND created_at >= ?`;
        params.push(filters.since);
      }

      if (filters.search) {
        query += ` AND (message LIKE ? OR metadata LIKE ?)`;
        params.push(`%${filters.search}%`, `%${filters.search}%`);
      }

      // Order by most recent first
      query += ` ORDER BY created_at DESC`;

      // Add limit
      const limit = filters.limit || 100;
      query += ` LIMIT ?`;
      params.push(limit);

      const logs = await getAllQuery(query, params);

      // Parse metadata JSON
      return logs.map(log => ({
        ...log,
        metadata: log.metadata ? JSON.parse(log.metadata) : {}
      }));
    } catch (error) {
      logger.error('Failed to retrieve app logs:', error);
      return [];
    }
  }

  /**
   * Clean up old logs (keep only last N days)
   * @param {number} daysToKeep - Number of days to keep
   */
  static async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await runQuery(`
        DELETE FROM app_logs 
        WHERE created_at < ?
      `, [cutoffDate.toISOString()]);

      logger.info(`Cleaned up old app logs, removed ${result.changes || 0} entries`);
      return result.changes || 0;
    } catch (error) {
      logger.error('Failed to cleanup old app logs:', error);
      return 0;
    }
  }

  /**
   * Get log statistics
   */
  static async getLogStats() {
    try {
      const stats = await getAllQuery(`
        SELECT 
          level,
          category,
          COUNT(*) as count,
          MAX(created_at) as latest
        FROM app_logs 
        WHERE created_at >= datetime('now', '-24 hours')
        GROUP BY level, category
        ORDER BY count DESC
      `);

      return stats;
    } catch (error) {
      logger.error('Failed to get log statistics:', error);
      return [];
    }
  }
}

module.exports = AppLoggerService;
