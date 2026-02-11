module.exports = {
  apps: [
    {
      name: 'desenrola',
      script: 'node_modules/.bin/next',
      args: 'start -p 3020',
      cwd: '/root/desenrola',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3020,
      },
    },
  ],
};
