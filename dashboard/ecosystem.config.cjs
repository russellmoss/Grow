/**
 * PM2 Ecosystem Configuration
 * 
 * Manages the AI Review Service for 24/7 operation on Raspberry Pi.
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'growop-ai',
      script: './server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        AI_SERVICE_PORT: 3001,
      },
      
      // Restart daily at 5:00 AM (before the 5:30 review) to clear memory
      cron_restart: '0 5 * * *',
      
      // Logging
      error_file: './logs/ai-error.log',
      out_file: './logs/ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // Graceful restart
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
