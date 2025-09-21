const express = require('express');
const { getQuery } = require('../config/database');
const logger = require('../utils/logger');

const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    const healthCheck = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'checking...',
        filesystem: 'checking...'
      }
    };

    // Check database connection
    try {
      await getQuery('SELECT 1');
      healthCheck.services.database = 'OK';
    } catch (dbError) {
      healthCheck.services.database = 'ERROR';
      healthCheck.status = 'DEGRADED';
      logger.error('Database health check failed:', dbError);
    }

    // Check filesystem access
    try {
      const fs = require('fs').promises;
      const path = require('path');
      const testPath = path.join(process.env.LOG_PATH || './data/logs', '.health-check');
      await fs.writeFile(testPath, 'health-check');
      await fs.unlink(testPath);
      healthCheck.services.filesystem = 'OK';
    } catch (fsError) {
      healthCheck.services.filesystem = 'ERROR';
      healthCheck.status = 'DEGRADED';
      logger.error('Filesystem health check failed:', fsError);
    }

    const statusCode = healthCheck.status === 'OK' ? 200 : 503;
    res.status(statusCode).json({
      success: healthCheck.status === 'OK',
      data: healthCheck
    });

  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Detailed system info endpoint
router.get('/system', async (req, res) => {
  try {
    const systemInfo = {
      node_version: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      uptime: {
        process: Math.round(process.uptime()),
        system: require('os').uptime()
      },
      load_average: require('os').loadavg(),
      cpu_count: require('os').cpus().length
    };

    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    logger.error('System info check failed:', error);
    res.status(500).json({
      success: false,
      message: 'System info check failed',
      error: error.message
    });
  }
});

module.exports = router;
