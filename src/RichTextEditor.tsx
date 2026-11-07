import { useEffect, useRef, useState } from 'react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
}

type EditorCommand =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikeThrough'
  | 'subscript'
  | 'superscript'
  | 'insertUnorderedList'
  | 'insertOrderedList'
  | 'createLink'
  | 'unlink'
  | 'insertHorizontalRule'
  | 'formatBlock'
  | 'justifyLeft'
  | 'justifyCenter'
  | 'justifyRight'
  | 'justifyFull'
  | 'indent'
  | 'outdent'
  | 'foreColor'
  | 'hiliteColor'
  | 'insertHTML'
  | 'undo'
  | 'redo'
  | 'removeFormat';

const blockFormats = [
  { value: '<p>', label: 'Paragraph' },
  { value: '<h1>', label: 'Heading 1' },
  { value: '<h2>', label: 'Heading 2' },
  { value: '<h3>', label: 'Heading 3' },
  { value: '<blockquote>', label: 'Blockquote' },
  { value: '<pre>', label: 'Code block' },
];

type FormatSnapshot = {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  subscript: boolean;
  superscript: boolean;
  color: string;
  backgroundColor: string;
  textAlign: string;
};

type IconName =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strike'
  | 'subscript'
  | 'superscript'
  | 'code'
  | 'clear'
  | 'bulletedList'
  | 'numberedList'
  | 'table'
  | 'image'
  | 'rule'
  | 'alignLeft'
  | 'alignCenter'
  | 'alignRight'
  | 'justify'
  | 'indent'
  | 'outdent'
  | 'link'
  | 'unlink'
  | 'formatPainter'
  | 'undo'
  | 'redo';

const iconPaths: Record<IconName, string> = {
  bold: '',
  italic: '',
  underline: 'M5 4v7a7 7 0 0 0 14 0V4 M4 21h16',
  strike: 'M4 12h16 M7 7a4 4 0 0 1 7-2 M17 17a4 4 0 0 1-7 2',
  subscript: '',
  superscript: '',
  code: 'm7 7-5 5 5 5 M17 7l5 5-5 5 M14 4l-4 16',
  clear: 'M4 5h16 M7 5l1 15h8l1-15 M9 9v7 M15 9v7',
  bulletedList: 'M9 6h12 M9 12h12 M9 18h12 M4 6h.01 M4 12h.01 M4 18h.01',
  numberedList: 'M10 6h11 M10 12h11 M10 18h11',
  table: 'M3 4h18v16H3z M3 10h18 M3 15h18 M9 4v16 M15 4v16',
  image: 'M4 4h16v16H4z M4 15l5-5 4 4 3-3 4 4 M9 8h.01',
  rule: 'M3 12h18',
  alignLeft: 'M3 5h18 M3 10h12 M3 15h18 M3 20h12',
  alignCenter: 'M3 5h18 M6 10h12 M3 15h18 M6 20h12',
  alignRight: 'M3 5h18 M9 10h12 M3 15h18 M9 20h12',
  justify: 'M3 5h18 M3 10h18 M3 15h18 M3 20h18',
  indent: 'M3 5h18 M9 10h12 M9 15h12 M3 20h18 M3 12l3 3-3 3',
  outdent: 'M3 5h18 M9 10h12 M9 15h12 M3 20h18 M6 12l-3 3 3 3',
  link: 'M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7 M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7',
  unlink: 'M10 13a5 5 0 0 0 7.1 0l3-3a5 5 0 0 0-7.1-7.1l-1.7 1.7 M14 11a5 5 0 0 0-7.1 0l-3 3a5 5 0 0 0 7.1 7.1l1.7-1.7 M3 3l18 18',
  formatPainter: '',
  undo: 'M9 14 4 9l5-5 M4 9h10a6 6 0 0 1 0 12h-2',
  redo: 'm15 14 5-5-5-5 M20 9H10a6 6 0 0 0 0 12h2',
};

const iconText: Partial<Record<IconName, string>> = {
  bold: 'B',
  italic: 'I',
  subscript: 'x₂',
  superscript: 'x²',
  numberedList: '1',
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      aria-hidden="true"
      className={`rwe__icon${name === 'formatPainter' ? ' rwe__icon--format-painter' : ''}`}
      fill="none"
      focusable="false"
      viewBox="0 0 24 24"
    >
      {name === 'formatPainter' ? (
        <g fill="currentColor" stroke="none">
          <path d="M21.05 1.07h1.14l.6.34.41.74v1.07l-.67 1.67-1.28 1.68-2.61 2.41-1.95 1.41 3.56 3.76-.07.33-1.61 1.61-.54 0-9.78-9.79-.07-.53 1.61-1.68.33-.07 3.76 3.56 1.74-2.35 2.08-2.21 1.67-1.28z" />
          <path d="M7.64 6.97 17.3 16.56l-6.84 6.97-.81-.8.88-1.34-1.41.87-1.21-1.28 2.95-3.01 1.61-2.01-.74.46-4.22 4.23-1.28-1.41 2.15-2.82-2.61 2.49-1.88-1.88 1.67-2.21-2.07 1.67-1.21-1.07 2.55-3.15-2.89 2.75L.8 13.94z" />
        </g>
      ) : iconPaths[name] && <path d={iconPaths[name]} />}
      {iconText[name] && (
        <text
          className={`rwe__icon-text rwe__icon-text--${name}`}
          x={name === 'numberedList' ? 5 : 12}
          y="17"
          textAnchor="middle"
        >
          {iconText[name]}
        </text>
      )}
      {name === 'strike' && (
        <text className="rwe__icon-text" x="12" y="17" textAnchor="middle">S</text>
      )}
      {name === 'clear' && (
        <text className="rwe__icon-text rwe__icon-text--clear" x="12" y="15" textAnchor="middle">T</text>
      )}
    </svg>
  );
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing…',
  ariaLabel = 'Rich text editor',
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const copiedFormatRef = useRef<FormatSnapshot | null>(null);
  const [dialog, setDialog] = useState<'link' | 'image' | 'table' | null>(null);
  const [isSourceEditing, setIsSourceEditing] = useState(false);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const [tableRows, setTableRows] = useState('3');
  const [tableColumns, setTableColumns] = useState('3');

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value;
    }
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      selectionRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    const range = selectionRef.current;
    if (!selection || !range) return;

    selection.removeAllRanges();
    selection.addRange(range);
  };

  const emitChange = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  const runCommand = (command: EditorCommand, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();
    if (command === 'foreColor' || command === 'hiliteColor') {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(command, false, commandValue);
    emitChange();
    saveSelection();
  };

  const copyFormatting = () => {
    const editor = editorRef.current;
    restoreSelection();
    const selection = window.getSelection();
    if (!editor || !selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    const selectedNode = range.startContainer;
    const selectedElement = selectedNode.nodeType === Node.ELEMENT_NODE
      ? selectedNode as HTMLElement
      : selectedNode.parentElement;
    const formatElement = selectedElement && editor.contains(selectedElement)
      ? selectedElement
      : editor;
    const blockElement = formatElement.closest('p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div') ?? editor;
    const computedStyle = window.getComputedStyle(formatElement);

    copiedFormatRef.current = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      subscript: document.queryCommandState('subscript'),
      superscript: document.queryCommandState('superscript'),
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      textAlign: window.getComputedStyle(blockElement).textAlign,
    };
    setIsFormatPainterActive(true);
  };

  const pasteFormatting = () => {
    const editor = editorRef.current;
    const format = copiedFormatRef.current;
    const selection = window.getSelection();
    if (!editor || !format || !selection?.rangeCount || selection.isCollapsed) return;
    if (!editor.contains(selection.getRangeAt(0).commonAncestorContainer)) return;

    editor.focus();
    restoreSelection();
    const inlineCommands: (keyof Pick<
      FormatSnapshot,
      'bold' | 'italic' | 'underline' | 'strikeThrough' | 'subscript' | 'superscript'
    >)[] = ['bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript'];
    for (const command of inlineCommands) {
      if (document.queryCommandState(command) !== format[command]) {
        document.execCommand(command);
      }
    }

    document.execCommand('styleWithCSS', false, 'true');
    document.execCommand('foreColor', false, format.color);
    document.execCommand(
      'hiliteColor',
      false,
      format.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'transparent' : format.backgroundColor,
    );

    const alignmentCommands: Record<string, EditorCommand> = {
      left: 'justifyLeft',
      start: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      end: 'justifyRight',
      justify: 'justifyFull',
    };
    const alignmentCommand = alignmentCommands[format.textAlign];
    if (alignmentCommand) document.execCommand(alignmentCommand);

    emitChange();
    saveSelection();
    setIsFormatPainterActive(false);
  };

  const handleEditorSelection = () => {
    saveSelection();
    if (isFormatPainterActive) pasteFormatting();
  };

  const openLinkDialog = () => {
    setLinkUrl('');
    setDialog('link');
  };

  const openImageDialog = () => {
    setImageUrl('');
    setImageAlt('');
    setImageUrlError('');
    setDialog('image');
  };

  const insertImage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let url: URL;
    try {
      url = new URL(imageUrl.trim());
    } catch {
      setImageUrlError('Enter a valid image URL.');
      return;
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      setImageUrlError('Use an HTTP or HTTPS image URL.');
      return;
    }

    runCommand(
      'insertHTML',
      `<img src="${escapeHtml(url.href)}" alt="${escapeHtml(imageAlt.trim())}">`,
    );
    setDialog(null);
  };

  const insertTable = (rows: number, columns: number) => {
    const header = `<tr>${'<th><br></th>'.repeat(columns)}</tr>`;
    const body = Array.from({ length: rows - 1 }, () => (
      `<tr>${'<td><br></td>'.repeat(columns)}</tr>`
    )).join('');
    runCommand('insertHTML', `<table><thead>${header}</thead><tbody>${body}</tbody></table><p><br></p>`);
    setDialog(null);
  };

  const insertInlineCode = () => {
    restoreSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? '';
    const content = selectedText ? escapeHtml(selectedText) : '<br>';
    runCommand('insertHTML', `<code>${content}</code>`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      saveSelection();
      openLinkDialog();
      return;
    }

    if (event.key !== ' ') return;

    const selection = window.getSelection();
    const editor = editorRef.current;
    const node = selection?.anchorNode;
    if (!editor || !selection?.isCollapsed || !node || node.nodeType !== Node.TEXT_NODE) return;

    const textBeforeCaret = node.textContent?.slice(0, selection.anchorOffset) ?? '';
    const block = node.parentElement?.closest('p, div');
    if (!block || block.textContent !== textBeforeCaret) return;

    const shortcut = /^#{1,3}$/.test(textBeforeCaret)
      ? { command: 'formatBlock', value: `<h${textBeforeCaret.length}>` }
      : textBeforeCaret === '>'
        ? { command: 'formatBlock', value: '<blockquote>' }
        : textBeforeCaret === '-'
          ? { command: 'insertUnorderedList' }
          : textBeforeCaret === '1.'
            ? { command: 'insertOrderedList' }
            : null;

    if (!shortcut) return;
    event.preventDefault();
    document.execCommand('delete');
    document.execCommand(shortcut.command, false, shortcut.value);
    emitChange();
    saveSelection();
  };

  const button = (
    label: string,
    icon: IconName,
    onClick: () => void,
    shortcut?: string,
    disabled = false,
    pressed?: boolean,
  ) => (
    <button
      className="rwe__button"
      key={label}
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={pressed}
      disabled={disabled || (isSourceEditing && label !== 'Edit HTML' && label !== 'Visual editor')}
      onMouseDown={(event) => {
        saveSelection();
        event.preventDefault();
      }}
      onClick={onClick}
    >
      <Icon name={icon} />
    </button>
  );

  return (
    <div className={['rwe', className].filter(Boolean).join(' ')}>
      <div className="rwe__toolbar" role="toolbar" aria-label="Text formatting">
        <div className="rwe__group">
          <select
            className="rwe__select"
            aria-label="Block format"
            defaultValue=""
            disabled={isSourceEditing}
            onMouseDown={saveSelection}
            onChange={(event) => {
              if (event.target.value) runCommand('formatBlock', event.target.value);
              event.target.value = '';
            }}
          >
            <option value="" disabled>Paragraph</option>
            {blockFormats.slice(1).map(({ value: format, label }) => (
              <option key={format} value={format}>{label}</option>
            ))}
          </select>
        </div>
        <div className="rwe__group">
          {button('Bold', 'bold', () => runCommand('bold'), 'Ctrl+B')}
          {button('Italic', 'italic', () => runCommand('italic'), 'Ctrl+I')}
          {button('Underline', 'underline', () => runCommand('underline'))}
          {button('Strikethrough', 'strike', () => runCommand('strikeThrough'))}
          {button('Subscript', 'subscript', () => runCommand('subscript'))}
          {button('Superscript', 'superscript', () => runCommand('superscript'))}
          {button('Inline code', 'code', insertInlineCode)}
          {button('Clear formatting', 'clear', () => runCommand('removeFormat'))}
        </div>
        <div className="rwe__group">
          {button('Bulleted list', 'bulletedList', () => runCommand('insertUnorderedList'))}
          {button('Numbered list', 'numberedList', () => runCommand('insertOrderedList'))}
          {button('Insert table', 'table', () => setDialog('table'))}
          {button('Insert image', 'image', openImageDialog)}
          {button('Horizontal rule', 'rule', () => runCommand('insertHorizontalRule'))}
        </div>
        <div className="rwe__group">
          {button('Align left', 'alignLeft', () => runCommand('justifyLeft'))}
          {button('Align center', 'alignCenter', () => runCommand('justifyCenter'))}
          {button('Align right', 'alignRight', () => runCommand('justifyRight'))}
          {button('Justify', 'justify', () => runCommand('justifyFull'))}
          {button('Decrease indent', 'outdent', () => runCommand('outdent'))}
          {button('Increase indent', 'indent', () => runCommand('indent'))}
        </div>
        <div className="rwe__group">
          <label className="rwe__color">
            Text
            <input
              aria-label="Text color"
              type="color"
              defaultValue="#0f172a"
              disabled={isSourceEditing}
              onMouseDown={saveSelection}
              onChange={(event) => runCommand('foreColor', event.target.value)}
            />
          </label>
          <label className="rwe__color">
            Highlight
            <input
              aria-label="Highlight color"
              type="color"
              defaultValue="#fff176"
              disabled={isSourceEditing}
              onMouseDown={saveSelection}
              onChange={(event) => runCommand('hiliteColor', event.target.value)}
            />
          </label>
        </div>
        <div className="rwe__group">
          {button('Add link', 'link', openLinkDialog, 'Ctrl+K')}
          {button('Remove link', 'unlink', () => runCommand('unlink'))}
          {button('Undo', 'undo', () => runCommand('undo'), 'Ctrl+Z')}
          {button('Redo', 'redo', () => runCommand('redo'), 'Ctrl+Y')}
          {button(
            'Format painter',
            'formatPainter',
            () => {
              if (isFormatPainterActive) {
                setIsFormatPainterActive(false);
              } else {
                copyFormatting();
              }
            },
            undefined,
            false,
            isFormatPainterActive,
          )}
          {button(
            isSourceEditing ? 'Visual editor' : 'Edit HTML',
            'code',
            () => {
              setDialog(null);
              setIsFormatPainterActive(false);
              setIsSourceEditing((current) => !current);
            },
          )}
        </div>
      </div>
      {dialog === 'link' && (
        <form
          className="rwe__dialog"
          aria-label="Insert link"
          onSubmit={(event) => {
            event.preventDefault();
            if (linkUrl.trim()) runCommand('createLink', linkUrl.trim());
            setDialog(null);
          }}
        >
          <label>
            URL
            <input
              autoFocus
              type="url"
              required
              value={linkUrl}
              placeholder="https://example.com"
              onChange={(event) => setLinkUrl(event.target.value)}
            />
          </label>
          <div className="rwe__dialog-actions">
            <button type="button" onClick={() => setDialog(null)}>Cancel</button>
            <button type="submit">Insert link</button>
          </div>
        </form>
      )}
      {dialog === 'image' && (
        <form
          className="rwe__dialog"
          aria-label="Insert image"
          onSubmit={insertImage}
        >
          <label>
            Image URL
            <input
              autoFocus
              type="url"
              required
              value={imageUrl}
              placeholder="https://example.com/image.jpg"
              onChange={(event) => {
                setImageUrl(event.target.value);
                setImageUrlError('');
              }}
            />
          </label>
          <label>
            Alt text (optional)
            <input
              type="text"
              value={imageAlt}
              onChange={(event) => setImageAlt(event.target.value)}
            />
          </label>
          {imageUrlError && <p className="rwe__dialog-error" role="alert">{imageUrlError}</p>}
          <div className="rwe__dialog-actions">
            <button type="button" onClick={() => setDialog(null)}>Cancel</button>
            <button type="submit">Insert image</button>
          </div>
        </form>
      )}
      {dialog === 'table' && (
        <form
          className="rwe__dialog"
          aria-label="Insert table"
          onSubmit={(event) => {
            event.preventDefault();
            insertTable(Number(tableRows), Number(tableColumns));
          }}
        >
          <label>
            Rows
            <input
              autoFocus
              type="number"
              min="1"
              max="20"
              step="1"
              required
              value={tableRows}
              onChange={(event) => setTableRows(event.target.value)}
            />
          </label>
          <label>
            Columns
            <input
              type="number"
              min="1"
              max="10"
              step="1"
              required
              value={tableColumns}
              onChange={(event) => setTableColumns(event.target.value)}
            />
          </label>
          <div className="rwe__dialog-actions">
            <button type="button" onClick={() => setDialog(null)}>Cancel</button>
            <button type="submit">Insert table</button>
          </div>
        </form>
      )}
      <textarea
        className="rwe__source"
        aria-label="HTML source"
        hidden={!isSourceEditing}
        spellCheck={false}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
      <div
        ref={editorRef}
        hidden={isSourceEditing}
        className={['rwe__content', isFormatPainterActive && 'rwe__content--format-painter'].filter(Boolean).join(' ')}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={ariaLabel}
        aria-multiline="true"
        data-placeholder={placeholder}
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
        onKeyDown={handleKeyDown}
        onKeyUp={handleEditorSelection}
        onMouseUp={handleEditorSelection}
        onBlur={saveSelection}
      />
    </div>
  );
}
