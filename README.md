# react-richtext-editor

A lightweight WYSIWYG editor component for React.

[Live demo](https://kenc90.github.io/react-richtext-editor/)

## Install

```sh
npm install github:kenc90/react-richtext-editor
```

GitHub installs build the package automatically before installation.

Requires `react` and `react-dom` 18 or newer as peer dependencies.

## Usage

```tsx
import { useState } from 'react';
import { RichTextEditor } from 'react-richtext-editor';

function Example() {
  const [html, setHtml] = useState('');

  return (
    <RichTextEditor
      value={html}
      onChange={setHtml}
      placeholder="Start writing your article..."
      ariaLabel="Article body editor"
      markdownShortcuts
    />
  );
}
```

`placeholder` is optional and has no default; it is shown while the editor is empty only when provided. The default styles are included and injected when the package is imported; no separate CSS import is required.

`ariaLabel` is optional and defaults to `Rich text editor`; customize it to give the editable textbox an accessible name.

`markdownShortcuts` is optional and defaults to `false`. Set it to `true` to enable Markdown shortcuts for headings (`#` through `###`), blockquotes (`>`), bulleted lists (`-`), and numbered lists (`1.`) when followed by a space.

## Choosing features

All editor features are enabled by default. Pass `features` to hide controls and disable their associated keyboard shortcuts; unspecified options remain enabled:

```tsx
<RichTextEditor
  value={html}
  onChange={setHtml}
  features={{ image: false, table: false, htmlSource: false }}
/>
```

`RichTextEditorFeatures` is exported for TypeScript consumers. Available options are `blockFormat`, `fontFamily`, `fontSize`, `lineSpacing`, `bold`, `italic`, `underline`, `strikeThrough`, `subscript`, `superscript`, `inlineCode`, `clearFormatting`, `bulletedList`, `numberedList`, `table`, `image`, `horizontalRule`, `textAlignment`, `indentation`, `textColor`, `highlight`, `link`, `undo`, `redo`, `formatPainter`, and `htmlSource`.

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

`value` and `onChange` use an HTML string. Use **Edit HTML** in the toolbar to edit the source directly; switch back to the visual editor to see the rendered result. To copy formatting, select the source text and click **Format painter**, then select the target text; the styling and alignment are applied to that selection. The toolbar also supports headings, blockquotes, code blocks and inline code, bold, italic, underline, strikethrough, lists, links, URL-based image insertion with optional alt text, tables, horizontal rules, alignment, indentation, font family and size, line spacing, text color, highlighting, undo/redo, and clear formatting.

The block-format menu includes **Normal text** (`<div>`) as well as paragraphs and headings. A `<span>` is inline rather than a block format, so normal text uses a `<div>` wrapper.

Font size and line spacing have presets plus custom numeric inputs with no hard-coded size or multiplier bounds. Enter a non-negative number and press Enter to apply it to selected text. With just a caret, font styling applies to subsequent typing and line spacing applies to the current block.

Pasting rich HTML keeps supported formatting while removing Word/Google-specific markup and unsafe attributes. Plain-text pasting continues to use the browser's native behavior.

Click an inserted image to align it or select its resize handle; the handle also supports arrow-key resizing when focused. Click a table cell to open **Table options**, where you can add or remove rows and columns, delete the table, and resize columns by dragging cell boundaries. Row and column editing is disabled for tables with merged cells.

The editor uses the browser's built-in `contentEditable` and editing commands; React is its only runtime dependency. Browser support for some built-in editing commands can vary. Image insertion accepts HTTP or HTTPS URLs; image uploads are not included.

Treat editor HTML as untrusted input when rendering or storing content from users, and sanitize it according to your application's needs.

## Development

```sh
npm install
npm run dev
npm run build
```

`npm run dev` starts the local demo. The GitHub Pages workflow builds and deploys the demo automatically on pushes to `main`; no generated demo files need to be committed. Set the repository's Pages source to **GitHub Actions** in **Settings → Pages**.

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE).
