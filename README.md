# openai-caching-proxy

Basic caching proxy for OpenAI API.

This can help reduce costs by caching OpenAI responses and returning the cached response for repeated requests.

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

You can try a sample request. The first will be proxied to OpenAI but the second repeated/duplicate request will return the cached result instead.

```ts
// Sample request: try the same request twice and
// the second one will return cached result:
const models1 = await openai.listModels();
console.log('models 1:', models1);

const models2 = await openai.listModels();
console.log('models 2:', models2);
```

### Samples

See `/samples/sample-usage.ts` for a full example of how to call this proxy with your openai client.
