module.exports = {
    apps: [
      {
        name: 'orderlyBinanceApp',
        script: './dist/index.js',
        watch: true,
        env: {
          NODE_ENV: 'development',
        },
        env_production: {
          NODE_ENV: 'production',
        },
      },
    ],
  };