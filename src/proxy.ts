import { RequestHandler } from 'express';
import { decodeUrl } from './utils';
import { rewriteHtml } from './rewrite';

export const proxyRequest: RequestHandler = async (req, res) => {
const raw = req.query.url as string;

if (!raw) {
  res.status(400).send('Missing ?url parameter.');
  return;
}

let targetUrl = decodeUrl(raw);

if (!targetUrl.includes('.')) {
  targetUrl = `https://www.startpage.com/do/search?query=${encodeURIComponent(targetUrl)}`;
}

console.log(`[Proxying] ${targetUrl}`);


  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Referer': 'https://google.com/',
        'Accept': '*/*',
        'Host': new URL(targetUrl).host,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');

    let body: string;

    try {
      body = await response.text();
    } catch (err) {
      console.log('Failed reading body:', err);
      res.status(502).send('Failed reading upstream response.');
      return;
    }

    if (!body) {
      console.warn('Empty body from:', targetUrl);
      res.status(502).send('Empty body from target.');
      return;
    }

    if (isHtml) {
      try {
        body = rewriteHtml(body, targetUrl);
      } catch (err) {
        console.error('Failed rewriting HTML:', err);
      }
    }

    res.setHeader('Content-Type', contentType);
    res.removeHeader('Content-Security-Policy');
    res.removeHeader('X-Frame-Options');
    res.status(response.status).send(body);

  } catch (err: any) {
    console.error('Error proxying request:', err);
    res.status(500).send('Error proxying request: ' + err.message);
  }
};
