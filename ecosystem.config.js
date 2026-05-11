module.exports = {
  apps: [
    {
      name: 'notification-api',
      script: 'npm',
      args: 'run start',        // node dist/server.js
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'notification-worker',
      script: 'npm',
      args: 'run start:worker',  // node dist/worker.js
      instances: 2,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};