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

`value` and `onChange` use an HTML string. Use **Edit HTML** in the toolbar to edit the source directly; switch back to the visual editor to see the rendered result. To copy formatting, select the source text and click **Format painter**, then select the target text; the styling and alignment are applied to that selection. The toolbar also supports headings, blockquotes, code blocks and inline code, bold, italic, underline, strikethrough, lists, links, tables, horizontal rules, alignment, indentation, text color, highlighting, undo/redo, and clear formatting. Markdown shortcuts are available for headings (`#` through `###`), blockquotes (`>`), bulleted lists (`-`), and numbered lists (`1.`) followed by a space.

The editor uses the browser's built-in `contentEditable` and editing commands; React is its only runtime dependency. Browser support for some built-in editing commands can vary. Images and server-side upload handling are not included. The component includes basic layout styles; override the `rwe` CSS classes or pass a `className` to customize it.

Treat editor HTML as untrusted input when rendering or storing content from users, and sanitize it according to your application's needs.

## Development

```sh
npm install
npm run build
```

The GitHub Pages demo is built with `npm run build:demo`. The Pages workflow deploys it when changes are pushed to `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** in the repository to publish it.
