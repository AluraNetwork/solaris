import express from 'express';
import cors from 'cors';
import path from 'path';
import { proxyRequest } from './proxy';
import { handleWebSocket } from './wsProxy';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.get('/proxy', proxyRequest);

const server = app.listen(PORT, () => {
  console.log(`crappy proxy is running at http://localhost:${PORT}`);
});

server.on('upgrade', handleWebSocket);
