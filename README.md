# openai-caching-proxy

Basic caching proxy for OpenAI API.

This can help reduce costs by caching OpenAI responses and returning the cached response for repeated requests.

**Usage**

Start the proxy server (will start at http://localhost:3001 by default):

```
yarn start
```

Then, in your `openai-node` configration, pass in the new base URL:

```diff
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
+ basePath: 'http://localhost:3001/proxy',
});
const openai = new OpenAIApi(configuration);
```
