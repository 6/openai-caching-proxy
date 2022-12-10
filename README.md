# openai-caching-proxy

Basic caching proxy for OpenAI API.

This can help reduce costs (and get faster results) by returning cached responses for repeated requests.

### Usage

Start the proxy server (will start at http://localhost:3001 by default):

```
yarn start
```

Then, in your `openai` configuration, pass in the new `basePath` so that it sends requests through your proxy rather than directly to OpenAI:

```diff
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
+ basePath: 'http://localhost:3001/proxy',
});
const openai = new OpenAIApi(configuration);
```

You can try a sample request. The first will be proxied to OpenAI since a cached response isn't yet saved for it, but the second repeated/duplicate request will return the cached result instead.

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

### Samples

See `/samples/sample-usage.ts` for a full example of how to call this proxy with your openai client.
