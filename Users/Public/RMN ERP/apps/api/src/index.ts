import { buildApp } from './app.js';
import { config, logger } from '@rmn-erp/core';

async function start() {
  try {
    const app = await buildApp();
    const port = config?.PORT ? parseInt(config.PORT, 10) : 3000;
    
    await app.listen({ port, host: '0.0.0.0' });
    
    logger.info(`Server listening on port ${port} in ${config?.NODE_ENV || 'development'} mode`);

    const shutdown = async () => {
      logger.info('Graceful shutdown initiated...');
      await app.close();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

start();
