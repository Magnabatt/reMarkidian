const express = require('express');
const { runQuery, getQuery, getAllQuery } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Get all vaults
router.get('/', async (req, res) => {
  try {
    const vaults = await getAllQuery(`
      SELECT 
        id, name, github_repo, github_branch, local_path, 
        sync_enabled, last_sync, created_at, updated_at
      FROM vaults 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: vaults
    });
  } catch (error) {
    logger.error('Error fetching vaults:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vaults'
    });
  }
});

// Get single vault
router.get('/:id', async (req, res) => {
  try {
    const vault = await getQuery(`
      SELECT 
        id, name, github_repo, github_branch, local_path, 
        sync_enabled, last_sync, created_at, updated_at
      FROM vaults 
      WHERE id = ?
    `, [req.params.id]);

    if (!vault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    res.json({
      success: true,
      data: vault
    });
  } catch (error) {
    logger.error('Error fetching vault:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vault'
    });
  }
});

// Create new vault
router.post('/', async (req, res) => {
  try {
    const { name, github_repo, github_token, github_branch = 'main', local_path } = req.body;

    if (!name || !github_repo || !github_token || !local_path) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, github_repo, github_token, local_path'
      });
    }

    const result = await runQuery(`
      INSERT INTO vaults (name, github_repo, github_token, github_branch, local_path)
      VALUES (?, ?, ?, ?, ?)
    `, [name, github_repo, github_token, github_branch, local_path]);

    logger.vault(`Created new vault: ${name}`, { vaultId: result.id, github_repo });

    res.status(201).json({
      success: true,
      message: 'Vault created successfully',
      data: { id: result.id }
    });
  } catch (error) {
    logger.error('Error creating vault:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        message: 'Vault name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create vault'
    });
  }
});

// Update vault
router.put('/:id', async (req, res) => {
  try {
    const { name, github_repo, github_token, github_branch, local_path, sync_enabled } = req.body;
    const vaultId = req.params.id;

    // Check if vault exists
    const existingVault = await getQuery('SELECT id FROM vaults WHERE id = ?', [vaultId]);
    if (!existingVault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    const result = await runQuery(`
      UPDATE vaults 
      SET name = ?, github_repo = ?, github_token = ?, github_branch = ?, 
          local_path = ?, sync_enabled = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, github_repo, github_token, github_branch, local_path, sync_enabled, vaultId]);

    logger.vault(`Updated vault: ${name}`, { vaultId });

    res.json({
      success: true,
      message: 'Vault updated successfully'
    });
  } catch (error) {
    logger.error('Error updating vault:', error);
    
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({
        success: false,
        message: 'Vault name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update vault'
    });
  }
});

// Delete vault
router.delete('/:id', async (req, res) => {
  try {
    const vaultId = req.params.id;

    // Check if vault exists
    const existingVault = await getQuery('SELECT name FROM vaults WHERE id = ?', [vaultId]);
    if (!existingVault) {
      return res.status(404).json({
        success: false,
        message: 'Vault not found'
      });
    }

    await runQuery('DELETE FROM vaults WHERE id = ?', [vaultId]);

    logger.vault(`Deleted vault: ${existingVault.name}`, { vaultId });

    res.json({
      success: true,
      message: 'Vault deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting vault:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vault'
    });
  }
});

module.exports = router;
