const supportedTags = new Set([
  'a', 'b', 'blockquote', 'br', 'caption', 'code', 'dd', 'div', 'dl', 'dt', 'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre',
  's', 'span', 'strike', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
  'th', 'thead', 'tr', 'u', 'ul',
]);

const discardedTags = new Set([
  'embed', 'iframe', 'link', 'meta', 'object', 'script', 'style', 'svg',
]);

const supportedStyles = [
  'background-color',
  'color',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'line-height',
  'text-align',
  'text-decoration',
  'vertical-align',
];

const supportedAttributes = new Set([
  'alt', 'colspan', 'height', 'href', 'rowspan', 'src', 'title', 'width',
]);

function isSafeUrl(value: string, image: boolean) {
  const url = value.trim();
  if (!url || (!image && url.startsWith('#'))) return Boolean(url);

  try {
    const protocol = new URL(url, document.baseURI).protocol;
    return image
      ? protocol === 'http:' || protocol === 'https:'
      : protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:' || protocol === 'tel:';
  } catch {
    return false;
  }
}

function normalizeFont(element: Element, document: Document) {
  const span = document.createElement('span');
  const face = element.getAttribute('face');
  const color = element.getAttribute('color');
  const fontSize = Number(element.getAttribute('size'));
  const sizes = ['', '10px', '13px', '16px', '18px', '24px', '32px', '48px'];

  if (face) span.style.fontFamily = face;
  if (color) span.style.color = color;
  if (Number.isInteger(fontSize) && fontSize > 0 && fontSize < sizes.length) {
    span.style.fontSize = sizes[fontSize];
  }
  while (element.firstChild) span.append(element.firstChild);
  element.replaceWith(span);
  return span;
}

function cleanStyle(element: Element) {
  const source = document.createElement('span');
  const rawStyle = element.getAttribute('style');
  if (!rawStyle) return;
  source.setAttribute('style', rawStyle);

  const safeStyle = document.createElement('span').style;
  for (const property of supportedStyles) {
    const value = source.style.getPropertyValue(property).trim();
    if (value && !/url\s*\(|expression|javascript:/i.test(value)) {
      safeStyle.setProperty(property, value);
    }
  }

  if (safeStyle.length) element.setAttribute('style', safeStyle.cssText);
  else element.removeAttribute('style');
}

export function normalizePastedHtml(html: string) {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  for (const sourceElement of Array.from(parsed.body.querySelectorAll('*')).reverse()) {
    let element = sourceElement;
    if (!element.parentNode) continue;

    let tag = element.tagName.toLowerCase();
    if (discardedTags.has(tag)) {
      element.remove();
      continue;
    }
    if (tag === 'font') {
      element = normalizeFont(element, parsed);
      tag = 'span';
    }
    if (!supportedTags.has(tag)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }

    cleanStyle(element);
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      if (name === 'style') continue;
      if (!supportedAttributes.has(name)) {
        element.removeAttribute(attribute.name);
      } else if ((name === 'href' || name === 'src') && !isSafeUrl(attribute.value, name === 'src')) {
        element.removeAttribute(attribute.name);
      } else if (['width', 'height', 'colspan', 'rowspan'].includes(name)
        && !/^\d{1,4}$/.test(attribute.value)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tag === 'img' && !element.hasAttribute('src')) {
      element.remove();
      continue;
    }
    if (tag === 'a' && !element.hasAttribute('href')) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    if (tag === 'span' && !element.hasAttribute('style')) {
      element.replaceWith(...Array.from(element.childNodes));
    }
  }

  return parsed.body.innerHTML;
}
