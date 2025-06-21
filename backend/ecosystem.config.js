module.exports = {
  apps: [{
    name: 'my-gtd-backend',
    script: 'dist/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Additional production settings
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Environment variables (these will be overridden by .env file)
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}; 