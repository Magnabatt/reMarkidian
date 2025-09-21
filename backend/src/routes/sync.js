const express = require('express');
const { runQuery, getQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');

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

    // TODO: Implement actual sync logic here
    // For now, we'll simulate a sync completion
    setTimeout(async () => {
      try {
        await runQuery(`
          UPDATE sync_history 
          SET status = 'success', notes_synced = 0, completed_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `, [syncResult.id]);

        await runQuery(`
          UPDATE vaults 
          SET last_sync = CURRENT_TIMESTAMP 
          WHERE id = ?
        `, [vault_id]);

        logger.sync(`Manual sync completed for vault: ${vault.name}`, { 
          vaultId: vault_id, 
          syncId: syncResult.id 
        });
      } catch (updateError) {
        logger.error('Error updating sync status:', updateError);
      }
    }, 2000);

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

module.exports = router;
