import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware, fixRequestBody, responseInterceptor } from 'http-proxy-middleware';
import morgan from 'morgan';
import { getCacheKey, readCache, writeCache } from './cache';

const app: Application = express();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// basic healthcheck endpoint
app.get('/', async (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Check for existing cached response for this request. If one exists,
// return it. Otherwise continue.
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Only cache POST requests that have a JSON request body, as these
  // are typically the requests that incur costs.
  if (req.method !== 'POST' || !req.is('application/json')) {
    return next();
  }
  const cacheKey = getCacheKey({
    authHeader: req.headers['authorization'],
    body: req.body,
    method: req.method,
    path: req.path,
  });
  res.locals.cacheKey = cacheKey;

  console.log(`Checking cache for: ${req.method} ${req.path}`, { cacheKey });

  const cachedResponse = await readCache({ cacheKey });
  if (cachedResponse) {
    console.log('Returning cached resopnse.');
    for (const [key, value] of Object.entries(cachedResponse.headers)) {
      res.setHeader(key, value);
    }
    return res.status(cachedResponse.status).send(cachedResponse.body);
  }

  console.log('No cache found, proxying request to api.openai.com instead.');

  next();
});

app.use(
  '/proxy',
  createProxyMiddleware({
    target: 'https://api.openai.com/v1',
    changeOrigin: true,
    pathRewrite: { '^/proxy': '' },
    selfHandleResponse: true,
    onProxyReq: fixRequestBody,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const response = responseBuffer.toString('utf8'); // convert buffer to string
      const cacheKey = (res as any).locals?.cacheKey; // This type is incorrect?
      if (cacheKey && res.statusCode >= 200 && res.statusCode < 300 && response?.length) {
        console.log('Writing 2xx response to cache: ', cacheKey);
        await writeCache({
          cacheKey,
          response: {
            headers: res.getHeaders() as Record<string, string>,
            body: response,
            status: res.statusCode,
          },
        });
      } else {
        console.log('Not caching error or empty response.');
      }

      return responseBuffer;
    }),
  }),
);

const port: number = Number(process.env.PORT || 3001);

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
