/**
 * PM2 Ecosystem Configuration
 *
 * Deploy on 34.35.85.28 with:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'mikrotik-proxy',
      script: 'dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production',
        PORT: 8443,
      },
      env_file: '.env',
      error_file: '/var/log/mikrotik-proxy/error.log',
      out_file: '/var/log/mikrotik-proxy/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
