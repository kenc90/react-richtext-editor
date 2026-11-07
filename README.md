# react-wysiwyg

A lightweight WYSIWYG editor component for React.

[Live demo](https://kenc90.github.io/react-wysiwyg/)

## Install

```sh
npm install github:kenc90/react-wysiwyg
```

GitHub installs build the package automatically before installation.

## Usage

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-wysiwyg';

function Example() {
  const [html, setHtml] = useState('<p>Write something...</p>');

  return <RichTextEditor value={html} onChange={setHtml} />;
}
```

The default styles are included and injected when the package is imported; no separate CSS import is required.

## Restyling

Pass `className` to add a class to the editor's outer element, then override the `rwe__...` classes from your own stylesheet. Scoping overrides under your class keeps them limited to that editor. For example:

```tsx
<RichTextEditor
  className="article-editor"
  value={html}
  onChange={setHtml}
/>
```

```css
.article-editor {
  border-color: #94a3b8;
  border-radius: 0.75rem;
}

.article-editor .rwe__toolbar {
  background: #f1f5f9;
}

.article-editor .rwe__content {
  font: 1rem/1.6 sans-serif;
  min-height: 16rem;
}

.article-editor .rwe__button:hover {
  background: #dbeafe;
}
```

Useful selectors include `.rwe__toolbar`, `.rwe__group`, `.rwe__button`, `.rwe__select`, `.rwe__content`, and `.rwe__source`. Add your override stylesheet to the consuming app; the editor's default styles remain included automatically.

`value` and `onChange` use an HTML string. Use **Edit HTML** in the toolbar to edit the source directly; switch back to the visual editor to see the rendered result. To copy formatting, select the source text and click **Format painter**, then select the target text; the styling and alignment are applied to that selection. The toolbar also supports headings, blockquotes, code blocks and inline code, bold, italic, underline, strikethrough, lists, links, URL-based image insertion with optional alt text, tables, horizontal rules, alignment, indentation, text color, highlighting, undo/redo, and clear formatting. Markdown shortcuts are available for headings (`#` through `###`), blockquotes (`>`), bulleted lists (`-`), and numbered lists (`1.`) followed by a space.

The editor uses the browser's built-in `contentEditable` and editing commands; React is its only runtime dependency. Browser support for some built-in editing commands can vary. Image insertion accepts HTTP or HTTPS URLs; image uploads are not included.

Treat editor HTML as untrusted input when rendering or storing content from users, and sanitize it according to your application's needs.

## Development

```sh
npm install
npm run build
```

To update the demo for GitHub Pages configured to deploy from the `main` branch root, run `npm run build:demo` and commit the generated root `index.html` and `assets/` files. No GitHub Action is required.
