export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('URL', ''),
  proxy: { koa: env.bool('IS_PROXIED', true) }, // THIS IS VERY IMPORTANT
  app: {
    keys: env.array('APP_KEYS'),
  },
});