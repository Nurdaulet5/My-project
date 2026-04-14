module.exports = {
  apps: [
    {
      name: 'silkway-backend',
      script: 'index.js',
      cwd: '/var/www/silkway/backend',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
