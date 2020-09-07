const env = {
  MUTA_ENDPOINT: 'http://127.0.0.1:8000/graphql',
  MUTA_ADDRESS_HRP: 'hb',
  MUTA_GRAPHQL_CALLER: 'hb1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq866hrc',

  HERMIT_DATABASE_URL: 'mysql://user:pass@127.0.0.1:3306/muta',
  HERMIT_CACHE_URL: 'redis://localhost:6379/1',
  DEBUG: 'muta-extra:*',
  // DEBUG: 'muta-extra:error;muta-extra:warn;muta-extra:info;',
};

module.exports = {
  apps: [
    {
      name: 'hermit-sync',
      script: './dist/sync.js',
      env: {
        ...env,
        // Prometheus metrics output port
        HERMIT_PORT: 4353,
      },
    },
    {
      name: 'hermit-api',
      script: './dist/server.js',
      env: {
        ...env,
        HERMIT_BYPASS_CHAIN: '/chain',
        HERMIT_CORS_ORIGIN: '',
        HERMIT_MAX_COMPLEXITY: 500,
        HERMIT_FETCH_CONCURRENCY: 50,
        HERMIT_MAX_SKIP_SIZE: 10000,
        HERMIT_PORT: 4040,
      },
    },
  ],
};
