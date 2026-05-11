module.exports = {
  apps: [
    {
      name: 'notification-api',
      script: 'npm',
      args: 'run start',
      cwd: '/srv/notification_eng',  
      instances: 1,
      exec_mode: 'fork',
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
      args: 'run start:worker',
      cwd: '/srv/notification_eng', 
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