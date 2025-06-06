// src/wsProxy.ts
import { IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { decodeUrl } from './utils';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  secure: false,
});

export function handleWebSocket(
  req: IncomingMessage,
  socket: any,
  head: Buffer
): void {
  const parsedUrl = new URL(req.url ?? '', 'http://localhost');
  const encodedTarget = parsedUrl.searchParams.get('url');
  if (!encodedTarget) {
    socket.destroy();
    return;
  }

  const target = decodeUrl(encodedTarget);

  proxy.ws(req, socket, head, { target });
}
