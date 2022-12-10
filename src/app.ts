import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { createProxyMiddleware, Filter, Options, RequestHandler } from 'http-proxy-middleware';
import morgan from 'morgan';

const app: Application = express();

app.use(cors());
app.use(morgan('dev'));

app.get('/', async (req: Request, res: Response) => {
  res.json({ hello: 'hola' });
});

app.use(
  '/proxy',
  createProxyMiddleware({
    target: 'https://api.openai.com/v1',
    changeOrigin: true,
    pathRewrite: { '^/proxy': '' },
  }),
);

// app.use(
//   '/api',
//   createProxyMiddleware({
//     target: 'http://www.example.org/api',
//     changeOrigin: true,
//   }),
// );

const port: number = Number(process.env.PORT || 3001);

app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});
