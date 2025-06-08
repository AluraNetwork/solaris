import { parseDocument } from 'htmlparser2';
import type { Document, Element } from 'domhandler';
import { Element as DomElement, Text } from 'domhandler';
import * as DomUtils from 'domutils';
import serialize from 'dom-serializer';
import { encodeUrl } from './utils';

export function rewriteHtml(html: string, baseUrl: string): string {
  if (typeof html !== 'string' || html.trim() === '') return '';

  let document: Document;
  try {
    document = parseDocument(html);
  } catch {
    return html;
  }

  const metas = DomUtils.findAll(
    (el): el is Element =>
      el.type === 'tag' &&
      el.name === 'meta' &&
      el.attribs?.['http-equiv']?.toLowerCase() === 'content-security-policy',
    document.children
  );
  for (const meta of metas) DomUtils.removeElement(meta);

  const cspMeta = new DomElement('meta', {
    'http-equiv': 'Content-Security-Policy',
    content: `default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;`
  });

  const script = new DomElement('script', {});
  script.children = [new Text(`console.log('Injection Live!');`)];

  const head = DomUtils.findOne(
    (el): el is DomElement => el.type === 'tag' && el.name === 'head',
    document.children
  );

  if (head) {
    DomUtils.prepend(head, script);
    DomUtils.prepend(head, cspMeta);
  } else {
    const htmlEl = DomUtils.findOne(
      (el): el is DomElement => el.type === 'tag' && el.name === 'html',
      document.children
    );
    if (htmlEl) {
      DomUtils.prepend(htmlEl, script);
      DomUtils.prepend(htmlEl, cspMeta);
    } else {
      DomUtils.prepend(document, script);
      DomUtils.prepend(document, cspMeta);
    }
  }

  const rewriteAttr = (el: DomElement, attr: string) => {
    const val = el.attribs?.[attr];
    if (!val) return;

    let resolved: string;

    if (!val.includes('.') && !val.includes('https://') && !val.includes('www.')) {
      resolved = `https://www.startpage.com/do/search?query=${encodeURIComponent(val)}`;
    } else {
      try {
        resolved = new URL(val, baseUrl).toString();
      } catch {
        return;
      }
    }

    el.attribs[attr] = `/proxy?url=${encodeUrl(resolved)}`;
  };

  const rewriteTags = DomUtils.findAll(
    (el): el is DomElement => el.type === 'tag',
    document.children
  );

  for (const el of rewriteTags) {
    switch (el.name) {
      case 'a':
      case 'link':
        rewriteAttr(el, 'href');
        break;
      case 'script':
      case 'img':
      case 'iframe':
      case 'source':
      case 'video':
      case 'audio':
      case 'embed':
      case 'track':
        rewriteAttr(el, 'src');
        break;
      case 'form':
        rewriteAttr(el, 'action');
        break;
    }
  }

  return serialize(document);
}
