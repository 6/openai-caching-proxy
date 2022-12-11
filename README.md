# openai-caching-proxy

Basic caching proxy for OpenAI API.

This can help reduce costs (and get faster results) by returning cached responses for repeated requests.

It only caches `POST` requests that have a JSON request body, as these tend to be the slowest and are the only ones that cost money (for now).

### Usage

Start the proxy server (will start at http://localhost:3001 by default):

```
yarn start
```

Then, in your [openai/openai-node](https://github.com/openai/openai-node) configuration, pass in the new `basePath` so that it sends requests through your proxy rather than directly to OpenAI:

```diff
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
+ basePath: `http://localhost:3001/proxy`,
});
const openai = new OpenAIApi(configuration);
```

You can then try a few sample requests. The first will be proxied to OpenAI since a cached response isn't yet saved for it, but the second repeated/duplicate request will return the cached result instead.

```ts
// This first request will be proxied as-is to OpenAI API, since a cached
// response does not yet exist for it:
const opts = { model: 'text-ada-001', prompt: 'write a poem about computers' };
const completion1 = await openai.createCompletion(opts);
console.log('completion1:', completion1);

// This second request uses the same opts, so it returns nearly instantly from
// local cache:
const completion1Cached = await openai.createCompletion(opts);
console.log('completion1Cached:', completion1Cached);

// This uses new completion opts so will be proxied as-is to OpenAI:
const completion2 = await openai.createCompletion({ ...opts, max_tokens: 40 });
console.log('completion2:', completion2);
```

### Specifying a cache TTL

If you don't want to indefinitely cache results, or you don't have an eviction policy set up on your redis instance, you can specify a TTL in seconds using the `X-Proxy-TTL` header.

```diff
const configuration = new Configuration({
  ...
+ baseOptions: {
+   // In this example, specify a cache TTL of 24 hours before it expires:
+   headers: { 'X-Proxy-TTL': 60 * 60 * 24 }
+ }
});
```

### Refreshing the cache

If you need to force refresh the cache, you can use the header `X-Proxy-Refresh`. This will fetch a new response from OpenAI and cache this new response.

```diff
const configuration = new Configuration({
  ...
+ baseOptions: {
+   headers: { 'X-Proxy-Refresh': 'true' }
+ }
});
```

### Samples

See `/samples/sample-usage.ts` for a full example of how to call this proxy with your openai client.
