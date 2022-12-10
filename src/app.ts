import express, { Application, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import {
  createProxyMiddleware,
  Filter,
  Options,
  RequestHandler,
  responseInterceptor,
} from 'http-proxy-middleware';
import morgan from 'morgan';
import { getCacheKey, readCache, writeCache } from './cache';

const app: Application = express();

app.use(cors());
app.use(morgan('dev'));

app.get('/', async (req: Request, res: Response) => {
  res.json({ hello: 'hola' });
});

const checkCache = async (req: Request, res: Response, next: NextFunction) => {
  const cacheKey = getCacheKey({
    authHeader: req.headers['authorization'],
    body: req.body,
    method: req.method,
    path: req.path,
  });
  res.locals.cacheKey = cacheKey;

  console.log('Checking cache for:', { method: req.method, path: req.path, cacheKey });

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
};

app.use(checkCache);

// Sample (easy) request to try:
// curl http://localhost:3001/proxy/models -H 'Authorization: Bearer YOUR_API_KEY'
app.use(
  '/proxy',
  createProxyMiddleware({
    target: 'https://api.openai.com/v1',
    changeOrigin: true,
    pathRewrite: { '^/proxy': '' },
    selfHandleResponse: true,
    onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
      const response = responseBuffer.toString('utf8'); // convert buffer to string
      console.log(response.substring(0, 25), '...'); // log response body

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
