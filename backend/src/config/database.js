const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/db/remarkidian.db');

let db = null;

// Initialize database connection
const initializeDatabase = async () => {
  try {
    // Ensure database directory exists
    const dbDir = path.dirname(DB_PATH);
    await fs.mkdir(dbDir, { recursive: true });

    // Create database connection
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        logger.error('Error opening database:', err);
        throw err;
      }
      logger.info(`Connected to SQLite database at ${DB_PATH}`);
    });

    // Enable foreign keys
    await runQuery('PRAGMA foreign_keys = ON');

    // Create tables
    await createTables();

    return db;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// Create database tables
const createTables = async () => {
  const tables = [
    // Vaults table
    `CREATE TABLE IF NOT EXISTS vaults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      github_repo TEXT NOT NULL,
      github_token TEXT NOT NULL,
      github_branch TEXT DEFAULT 'main',
      local_path TEXT NOT NULL,
      sync_enabled BOOLEAN DEFAULT 1,
      last_sync DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Sync history table
    `CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vault_id INTEGER,
      sync_type TEXT NOT NULL, -- 'manual', 'scheduled'
      status TEXT NOT NULL, -- 'success', 'error', 'in_progress'
      notes_synced INTEGER DEFAULT 0,
      errors_count INTEGER DEFAULT 0,
      error_message TEXT,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE
    )`,

    // Settings table
    `CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,

    // Notes table (track synced notes)
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vault_id INTEGER,
      remarkable_id TEXT NOT NULL,
      remarkable_uuid TEXT,
      file_name TEXT NOT NULL,
      visible_name TEXT,
      file_path TEXT NOT NULL,
      last_modified DATETIME,
      remarkable_last_modified DATETIME,
      remarkable_version INTEGER DEFAULT 1,
      synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      file_hash TEXT,
      processed BOOLEAN DEFAULT 0,
      parent_folder_id TEXT,
      is_folder BOOLEAN DEFAULT 0,
      file_type TEXT,
      file_size INTEGER,
      FOREIGN KEY (vault_id) REFERENCES vaults (id) ON DELETE CASCADE,
      UNIQUE(vault_id, remarkable_id)
    )`,

    // Notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL, -- 'sync_success', 'sync_error', 'vault_created', etc.
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const table of tables) {
    await runQuery(table);
  }

  // Insert default settings
  await insertDefaultSettings();

  logger.info('Database tables created successfully');
};

// Insert default settings
const insertDefaultSettings = async () => {
  const defaultSettings = [
    { key: 'sync_schedule', value: '0 */6 * * *', type: 'string', description: 'Cron schedule for automatic sync (every 6 hours)' },
    { key: 'discord_webhook_url', value: '', type: 'string', description: 'Discord webhook URL for notifications' },
    { key: 'notifications_enabled', value: 'true', type: 'boolean', description: 'Enable/disable notifications' },
    { key: 'ocr_provider', value: 'tesseract', type: 'string', description: 'OCR provider (tesseract, myscript, ai)' },
    { key: 'ai_summarization', value: 'false', type: 'boolean', description: 'Enable AI summarization of notes' },
    { key: 'github_sync_mode', value: 'direct', type: 'string', description: 'GitHub sync mode (direct, pr, branch)' },
    { key: 'remarkable_token', value: '', type: 'string', description: 'reMarkable Cloud API token' },
    { key: 'app_version', value: '1.0.0', type: 'string', description: 'Application version' }
  ];

  for (const setting of defaultSettings) {
    await runQuery(
      `INSERT OR IGNORE INTO settings (key, value, type, description) VALUES (?, ?, ?, ?)`,
      [setting.key, setting.value, setting.type, setting.description]
    );
  }
};

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.run(sql, params, function(err) {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

// Helper function to get data with promises
const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.get(sql, params, (err, row) => {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Helper function to get all data with promises
const getAllQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    if (!db) {
      reject(new Error('Database not initialized'));
      return;
    }

    db.all(sql, params, (err, rows) => {
      if (err) {
        logger.error('Database query error:', { sql, params, error: err.message });
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Close database connection
const closeDatabase = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initializeDatabase,
  runQuery,
  getQuery,
  getAllQuery,
  closeDatabase,
  get db() { return db; }
};
