const express = require('express');
const { runQuery, getQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await getAllQuery(`
      SELECT key, value, type, description, updated_at
      FROM settings 
      ORDER BY key
    `);

    // Convert settings to object format for easier frontend consumption
    const settingsObject = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // Convert based on type
      switch (setting.type) {
        case 'boolean':
          value = value === 'true';
          break;
        case 'number':
          value = parseFloat(value);
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch (e) {
            logger.error(`Invalid JSON in setting ${setting.key}:`, e);
          }
          break;
        default:
          // Keep as string
          break;
      }
      
      settingsObject[setting.key] = {
        value,
        type: setting.type,
        description: setting.description,
        updated_at: setting.updated_at
      };
    });

    res.json({
      success: true,
      data: settingsObject
    });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch settings'
    });
  }
});

// Get single setting
router.get('/:key', async (req, res) => {
  try {
    const setting = await getQuery(`
      SELECT key, value, type, description, updated_at
      FROM settings 
      WHERE key = ?
    `, [req.params.key]);

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    let value = setting.value;
    
    // Convert based on type
    switch (setting.type) {
      case 'boolean':
        value = value === 'true';
        break;
      case 'number':
        value = parseFloat(value);
        break;
      case 'json':
        try {
          value = JSON.parse(value);
        } catch (e) {
          logger.error(`Invalid JSON in setting ${setting.key}:`, e);
        }
        break;
    }

    res.json({
      success: true,
      data: {
        key: setting.key,
        value,
        type: setting.type,
        description: setting.description,
        updated_at: setting.updated_at
      }
    });
  } catch (error) {
    logger.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch setting'
    });
  }
});

// Update setting
router.put('/:key', async (req, res) => {
  try {
    const { value } = req.body;
    const key = req.params.key;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Value is required'
      });
    }

    // Check if setting exists
    const existingSetting = await getQuery('SELECT type FROM settings WHERE key = ?', [key]);
    if (!existingSetting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    // Convert value to string based on type
    let stringValue;
    switch (existingSetting.type) {
      case 'boolean':
        stringValue = Boolean(value).toString();
        break;
      case 'number':
        stringValue = Number(value).toString();
        break;
      case 'json':
        stringValue = JSON.stringify(value);
        break;
      default:
        stringValue = String(value);
        break;
    }

    await runQuery(`
      UPDATE settings 
      SET value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `, [stringValue, key]);

    logger.info(`Setting updated: ${key}`, { key, value: stringValue });

    res.json({
      success: true,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    logger.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update setting'
    });
  }
});

// Update multiple settings
router.put('/', async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Settings object is required'
      });
    }

    const updates = [];
    for (const [key, value] of Object.entries(settings)) {
      // Check if setting exists and get its type
      const existingSetting = await getQuery('SELECT type FROM settings WHERE key = ?', [key]);
      if (!existingSetting) {
        logger.warn(`Attempted to update non-existent setting: ${key}`);
        continue;
      }

      // Convert value to string based on type
      let stringValue;
      switch (existingSetting.type) {
        case 'boolean':
          stringValue = Boolean(value).toString();
          break;
        case 'number':
          stringValue = Number(value).toString();
          break;
        case 'json':
          stringValue = JSON.stringify(value);
          break;
        default:
          stringValue = String(value);
          break;
      }

      updates.push({ key, value: stringValue });
    }

    // Update all settings
    for (const update of updates) {
      await runQuery(`
        UPDATE settings 
        SET value = ?, updated_at = CURRENT_TIMESTAMP
        WHERE key = ?
      `, [update.value, update.key]);
    }

    logger.info(`Updated ${updates.length} settings`, { 
      keys: updates.map(u => u.key) 
    });

    res.json({
      success: true,
      message: `${updates.length} settings updated successfully`
    });
  } catch (error) {
    logger.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
});

// Reset setting to default
router.post('/:key/reset', async (req, res) => {
  try {
    const key = req.params.key;

    // Define default values
    const defaults = {
      'sync_schedule': '0 */6 * * *',
      'discord_webhook_url': '',
      'notifications_enabled': 'true',
      'ocr_provider': 'tesseract',
      'ai_summarization': 'false',
      'github_sync_mode': 'direct',
      'remarkable_token': ''
    };

    if (!defaults.hasOwnProperty(key)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reset this setting - no default value defined'
      });
    }

    await runQuery(`
      UPDATE settings 
      SET value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE key = ?
    `, [defaults[key], key]);

    logger.info(`Setting reset to default: ${key}`, { key, defaultValue: defaults[key] });

    res.json({
      success: true,
      message: 'Setting reset to default successfully'
    });
  } catch (error) {
    logger.error('Error resetting setting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset setting'
    });
  }
});

module.exports = router;
