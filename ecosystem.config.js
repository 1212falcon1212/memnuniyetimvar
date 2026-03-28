module.exports = {
  apps: [
    {
      name: "memnuniyetimvar-api",
      cwd: "./backend",
      script: "dist/main.js",
      instances: 2,
      exec_mode: "cluster",
      env_production: {
        NODE_ENV: "production",
        APP_PORT: 4000,
      },
    },
    {
      name: "memnuniyetimvar-frontend",
      cwd: "./frontend",
      script: "node_modules/.bin/next",
      args: "start",
      instances: 1,
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "memnuniyetimvar-admin",
      cwd: "./admin",
      script: "node_modules/.bin/next",
      args: "start --port 3001",
      instances: 1,
      env_production: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
  ],
};
