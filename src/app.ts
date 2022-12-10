import express, { Application, Request, Response } from 'express';
import cors from 'cors';

const app: Application = express();

app.use(cors());

app.get('/', async (req: Request, res: Response) => {
  res.json({ hello: 'hola' });
});

const port: number = Number(process.env.PORT || 3001);

const server = app.listen(port, function () {
  console.log(`App is listening on port ${port} !`);
});

// Set a long timeout globally for now, some non-streaming
// responses can take a while:
server.setTimeout(Number(process.env.SERVER_TIMEOUT || 60));
