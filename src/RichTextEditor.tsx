import { useEffect, useRef, useState, type CSSProperties, type FocusEventHandler } from 'react';
import { normalizePastedHtml } from './paste';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  features?: RichTextEditorFeatures;
  markdownShortcuts?: boolean;
  theme?: RichTextEditorTheme;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  focused?: boolean;
  height?: CSSProperties['height'];
  onFocus?: FocusEventHandler<HTMLDivElement>;
  onBlur?: FocusEventHandler<HTMLDivElement>;
}

export type RichTextEditorTheme = 'system' | 'light' | 'dark';

export interface RichTextEditorFeatures {
  blockFormat?: boolean;
  fontFamily?: boolean;
  fontSize?: boolean;
  lineSpacing?: boolean;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikeThrough?: boolean;
  subscript?: boolean;
  superscript?: boolean;
  inlineCode?: boolean;
  clearFormatting?: boolean;
  bulletedList?: boolean;
  numberedList?: boolean;
  table?: boolean;
  image?: boolean;
  horizontalRule?: boolean;
  textAlignment?: boolean;
  indentation?: boolean;
  textColor?: boolean;
  highlight?: boolean;
  link?: boolean;
  undo?: boolean;
  redo?: boolean;
  formatPainter?: boolean;
  htmlSource?: boolean;
}

const defaultFeatures: Required<RichTextEditorFeatures> = {
  blockFormat: true,
  fontFamily: true,
  fontSize: true,
  lineSpacing: true,
  bold: true,
  italic: true,
  underline: true,
  strikeThrough: true,
  subscript: true,
  superscript: true,
  inlineCode: true,
  clearFormatting: true,
  bulletedList: true,
  numberedList: true,
  table: true,
  image: true,
  horizontalRule: true,
  textAlignment: true,
  indentation: true,
  textColor: true,
  highlight: true,
  link: true,
  undo: true,
  redo: true,
  formatPainter: true,
  htmlSource: true,
};

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
  | 'removeFormat';

const blockFormats = [
  { value: '<div>', label: 'Normal text' },
  { value: '<p>', label: 'Paragraph' },
  { value: '<h1>', label: 'Heading 1' },
  { value: '<h2>', label: 'Heading 2' },
  { value: '<h3>', label: 'Heading 3' },
  { value: '<blockquote>', label: 'Blockquote' },
  { value: '<pre>', label: 'Code block' },
];

const fontFamilies = [
  { value: 'Arial', label: 'Arial' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Courier New', label: 'Courier New' },
  { value: 'Verdana', label: 'Verdana' },
];

const fontSizes = [
  { value: '10px', label: '10 px' },
  { value: '13px', label: '13 px' },
  { value: '16px', label: '16 px' },
  { value: '18px', label: '18 px' },
  { value: '24px', label: '24 px' },
  { value: '32px', label: '32 px' },
  { value: '48px', label: '48 px' },
];

const lineSpacings = [
  { value: '1', label: 'Single' },
  { value: '1.15', label: '1.15' },
  { value: '1.5', label: '1.5' },
  { value: '2', label: 'Double' },
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

type ToolbarFormatState = {
  blockFormat: string;
  fontFamily: string;
  fontSize: string;
  lineSpacing: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  subscript: boolean;
  superscript: boolean;
  bulletedList: boolean;
  numberedList: boolean;
  textAlign: string;
  textColor: string;
  highlightColor: string;
};

const initialToolbarFormat: ToolbarFormatState = {
  blockFormat: '<p>',
  fontFamily: '',
  fontSize: '',
  lineSpacing: '',
  bold: false,
  italic: false,
  underline: false,
  strikeThrough: false,
  subscript: false,
  superscript: false,
  bulletedList: false,
  numberedList: false,
  textAlign: 'left',
  textColor: '#0f172a',
  highlightColor: '#fff176',
};

type DialogType = 'link' | 'image' | 'table' | 'table-tools';
type ImageFrame = { top: number; left: number; width: number; height: number };
type ImageResizeStart = { image: HTMLImageElement; pointerX: number; width: number };
type ColumnResizeStart = {
  table: HTMLTableElement;
  columnIndex: number;
  pointerX: number;
  leftWidth: number;
  rightWidth: number;
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
  clear: 'M4 5h12 M10 5v13 M16 16l5 5 M21 16l-5 5',
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

function colorToHex(value: string, fallback: string) {
  const context = document.createElement('canvas').getContext('2d');
  if (!context) return fallback;
  context.fillStyle = '#000000';
  context.fillStyle = value;
  const normalized = context.fillStyle;
  if (/^#[\da-f]{6}$/i.test(normalized)) return normalized;
  const channels = normalized.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!channels) return fallback;
  return `#${channels.slice(1, 4).map((channel) => (
    Number(channel).toString(16).padStart(2, '0')
  )).join('')}`;
}

function isSimpleTable(table: HTMLTableElement) {
  const rows = Array.from(table.rows);
  const columnCount = rows[0]?.cells.length ?? 0;
  return columnCount > 0 && rows.every((row) => (
    row.cells.length === columnCount
    && Array.from(row.cells).every((cell) => cell.colSpan === 1 && cell.rowSpan === 1)
  ));
}

function formatHtml(html: string) {
  const blockTags = new Set([
    'address', 'article', 'aside', 'blockquote', 'body', 'caption', 'dd', 'details',
    'dialog', 'div', 'dl', 'dt', 'fieldset', 'figcaption', 'figure', 'footer', 'form',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hr', 'html', 'li', 'main',
    'nav', 'ol', 'p', 'pre', 'section', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead',
    'tr', 'ul',
  ]);
  const voidTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta',
    'param', 'source', 'track', 'wbr',
  ]);
  const preserveTags = new Set(['pre', 'script', 'style', 'textarea']);
  const tokens: Array<{
    raw: string;
    tagName?: string;
    closing?: boolean;
    block?: boolean;
  }> = [];
  let offset = 0;
  let rawTextTag: string | null = null;

  while (offset < html.length) {
    if (rawTextTag) {
      const closeIndex = html.toLowerCase().indexOf(`</${rawTextTag}`, offset);
      const textEnd = closeIndex < 0 ? html.length : closeIndex;
      if (textEnd > offset) tokens.push({ raw: html.slice(offset, textEnd) });
      offset = textEnd;
      rawTextTag = null;
      continue;
    }

    if (html.startsWith('<!--', offset)) {
      const commentEnd = html.indexOf('-->', offset + 4);
      const end = commentEnd < 0 ? html.length : commentEnd + 3;
      tokens.push({ raw: html.slice(offset, end), block: true });
      offset = end;
      continue;
    }

    if (html[offset] !== '<') {
      const nextTag = html.indexOf('<', offset);
      const end = nextTag < 0 ? html.length : nextTag;
      tokens.push({ raw: html.slice(offset, end) });
      offset = end;
      continue;
    }

    let end = offset + 1;
    let quote = '';
    while (end < html.length) {
      const character = html[end];
      if (quote) {
        if (character === quote) quote = '';
      } else if (character === '"' || character === "'") {
        quote = character;
      } else if (character === '>') {
        break;
      }
      end += 1;
    }

    if (end === html.length) {
      tokens.push({ raw: html.slice(offset) });
      break;
    }

    const raw = html.slice(offset, end + 1);
    const tagMatch = raw.match(/^<\s*(\/?)\s*([a-z][\w:-]*)\b/i);
    if (!tagMatch) {
      tokens.push({ raw });
    } else {
      const tagName = tagMatch[2].toLowerCase();
      const closing = tagMatch[1] === '/';
      tokens.push({ raw, tagName, closing, block: blockTags.has(tagName) });
      if (!closing && preserveTags.has(tagName) && !raw.endsWith('/>')) {
        rawTextTag = tagName;
      }
    }
    offset = end + 1;
  }

  let result = '';
  let depth = 0;
  const blockStack: string[] = [];
  const blockHasBlockChild: boolean[] = [];
  let preservedTag: string | null = null;
  const appendBlock = (content: string, indent: number) => {
    result = result.replace(/[ \t]+$/, '');
    if (result && !result.endsWith('\n')) result += '\n';
    result += `${'  '.repeat(indent)}${content}`;
  };

  tokens.forEach((token, index) => {
    const isPreservedClose = preservedTag !== null
      && token.closing
      && token.tagName === preservedTag;
    if (preservedTag && !isPreservedClose) {
      result += token.raw;
      return;
    }
    if (isPreservedClose) preservedTag = null;

    if (!token.tagName) {
      if (token.block) {
        appendBlock(token.raw, depth);
        return;
      }
      const previousIsBlock = tokens[index - 1]?.block ?? false;
      const nextIsBlock = tokens[index + 1]?.block ?? false;
      if (/^\s+$/.test(token.raw) && (previousIsBlock || nextIsBlock)) return;
      result += token.raw;
      return;
    }

    if (token.block) {
      if (token.closing) {
        const stackIndex = blockStack.lastIndexOf(token.tagName);
        if (stackIndex >= 0) {
          const hasBlockChild = blockHasBlockChild[stackIndex];
          blockStack.length = stackIndex;
          blockHasBlockChild.length = stackIndex;
          depth = stackIndex;
          if (hasBlockChild) appendBlock(token.raw, depth);
          else result += token.raw;
        } else {
          appendBlock(token.raw, depth);
        }
      } else {
        if (blockHasBlockChild.length) {
          blockHasBlockChild[blockHasBlockChild.length - 1] = true;
        }
        appendBlock(token.raw, depth);
        if (!voidTags.has(token.tagName) && !token.raw.endsWith('/>')) {
          blockStack.push(token.tagName);
          blockHasBlockChild.push(false);
          depth += 1;
        }
      }
    } else {
      result += token.raw;
    }

    if (!token.closing && preserveTags.has(token.tagName) && !token.raw.endsWith('/>')) {
      preservedTag = token.tagName;
    }
  });

  return result;
}

export function RichTextEditor({
  value,
  onChange,
  features: featureOverrides,
  markdownShortcuts = false,
  theme = 'system',
  placeholder,
  ariaLabel = 'Rich text editor',
  className,
  focused = false,
  height = 'auto',
  onFocus,
  onBlur,
}: RichTextEditorProps) {
  const features = { ...defaultFeatures, ...featureOverrides };
  const editorRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const historyRef = useRef({
    undo: [] as string[],
    redo: [] as string[],
    currentHtml: value,
    lastInputType: '',
    lastInputAt: 0,
  });
  const copiedFormatRef = useRef<FormatSnapshot | null>(null);
  const pendingInlineStyleRef = useRef<HTMLSpanElement | null>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const dialogTriggerRef = useRef<HTMLElement | null>(null);
  const imageResizeRef = useRef<ImageResizeStart | null>(null);
  const columnResizeRef = useRef<ColumnResizeStart | null>(null);
  const [dialog, setDialog] = useState<DialogType | null>(null);
  const [dialogPosition, setDialogPosition] = useState({ top: 0, left: 0 });
  const [isSourceEditing, setIsSourceEditing] = useState(false);
  const [htmlSourceDraft, setHtmlSourceDraft] = useState(value);
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  ));
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [imageFrame, setImageFrame] = useState<ImageFrame | null>(null);
  const [selectedCell, setSelectedCell] = useState<HTMLTableCellElement | null>(null);
  const [toolbarFormat, setToolbarFormat] = useState(initialToolbarFormat);
  const [customFontSizeDraft, setCustomFontSizeDraft] = useState<string | null>(null);
  const [customLineSpacingDraft, setCustomLineSpacingDraft] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [imageUrlError, setImageUrlError] = useState('');
  const [tableRows, setTableRows] = useState('3');
  const [tableColumns, setTableColumns] = useState('3');
  const isDarkTheme = theme === 'dark' || (theme === 'system' && systemPrefersDark);

  useEffect(() => {
    if (focused) editorRef.current?.focus();
  }, [focused]);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    const handleColorSchemeChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    setSystemPrefersDark(colorScheme.matches);
    colorScheme.addEventListener('change', handleColorSchemeChange);
    return () => colorScheme.removeEventListener('change', handleColorSchemeChange);
  }, []);

  const syncToolbarFormat = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const selection = window.getSelection();
    const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const range = liveRange && editor.contains(liveRange.commonAncestorContainer)
      ? liveRange
      : selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)
        ? selectionRef.current
        : null;
    if (!range) {
      setToolbarFormat(initialToolbarFormat);
      return;
    }

    let node: Node = range.startContainer;
    if (node.nodeType === Node.ELEMENT_NODE && node.childNodes.length) {
      node = node.childNodes.item(range.startOffset)
        ?? node.childNodes.item(range.startOffset - 1)
        ?? node;
    }
    const element = node.nodeType === Node.ELEMENT_NODE
      ? node as HTMLElement
      : node.parentElement ?? editor;
    const block = element.closest<HTMLElement>(
      'p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div,td,th',
    );
    const style = window.getComputedStyle(element);
    const blockStyle = block ? window.getComputedStyle(block) : style;
    const blockTag = block?.tagName.toLowerCase() ?? 'p';
    const blockFormat = blockFormats.some(({ value: format }) => (
      format.toLowerCase() === `<${blockTag}>`
    ))
      ? `<${blockTag}>`
      : '';
    const fontFamily = style.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    const fontSize = String(Number.parseFloat(style.fontSize) || '');
    const computedLineHeight = blockStyle.lineHeight;
    const lineHeightPixels = Number.parseFloat(computedLineHeight);
    const blockFontSize = Number.parseFloat(blockStyle.fontSize);
    const lineSpacing = computedLineHeight === 'normal' || !Number.isFinite(lineHeightPixels)
      ? ''
      : String(Number((lineHeightPixels / blockFontSize).toFixed(2)));
    const weight = Number.parseInt(style.fontWeight, 10);
    const decoration = `${style.textDecorationLine} ${style.textDecoration}`;
    const backgroundColor = style.backgroundColor;
    const transparentBackground = backgroundColor === 'transparent'
      || backgroundColor === 'rgba(0, 0, 0, 0)';

    setToolbarFormat({
      blockFormat,
      fontFamily,
      fontSize,
      lineSpacing,
      bold: style.fontWeight === 'bold' || weight >= 600,
      italic: style.fontStyle === 'italic' || style.fontStyle === 'oblique',
      underline: decoration.includes('underline'),
      strikeThrough: decoration.includes('line-through'),
      subscript: element.closest('sub') !== null || style.verticalAlign === 'sub',
      superscript: element.closest('sup') !== null || style.verticalAlign === 'super',
      bulletedList: element.closest('ul') !== null,
      numberedList: element.closest('ol') !== null,
      textAlign: blockStyle.textAlign,
      textColor: colorToHex(style.color, initialToolbarFormat.textColor),
      highlightColor: transparentBackground
        ? initialToolbarFormat.highlightColor
        : colorToHex(backgroundColor, initialToolbarFormat.highlightColor),
    });
  };

  const getImageFrame = (image: HTMLImageElement): ImageFrame | null => {
    const container = editorRef.current?.parentElement;
    if (!container || !container.contains(image)) return null;

    const imageRect = image.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      top: imageRect.top - containerRect.top - container.clientTop + container.scrollTop,
      left: imageRect.left - containerRect.left - container.clientLeft + container.scrollLeft,
      width: imageRect.width,
      height: imageRect.height,
    };
  };

  const getImageMaxWidth = () => {
    const editor = editorRef.current;
    if (!editor) return 32;
    const styles = window.getComputedStyle(editor);
    return Math.max(
      32,
      editor.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight),
    );
  };

  useEffect(() => {
    setHtmlSourceDraft(value);
    const editor = editorRef.current;
    if (editor) {
      if (editor.innerHTML !== value) {
        editor.innerHTML = value;
        selectionRef.current = null;
        pendingInlineStyleRef.current = null;
        setSelectedImage(null);
        setImageFrame(null);
        setSelectedCell(null);
        historyRef.current.undo = [];
        historyRef.current.redo = [];
        historyRef.current.lastInputType = '';
      }
      historyRef.current.currentHtml = editor.innerHTML;
      syncToolbarFormat();
    }
  }, [value]);

  useEffect(() => {
    if (
      (dialog === 'link' && !features.link)
      || (dialog === 'image' && !features.image)
      || ((dialog === 'table' || dialog === 'table-tools') && !features.table)
    ) {
      setDialog(null);
    }
    if (isSourceEditing && !features.htmlSource) setIsSourceEditing(false);
    if (!features.image) {
      setSelectedImage(null);
      setImageFrame(null);
    }
    if (!features.table) setSelectedCell(null);
    if (!features.formatPainter) setIsFormatPainterActive(false);
  }, [
    dialog,
    isSourceEditing,
    features.formatPainter,
    features.htmlSource,
    features.image,
    features.link,
    features.table,
  ]);

  useEffect(() => {
    if (!selectedImage) {
      setImageFrame(null);
      return;
    }

    const updateFrame = () => {
      const frame = getImageFrame(selectedImage);
      if (!frame) {
        setSelectedImage(null);
        setImageFrame(null);
        return;
      }
      setImageFrame(frame);
    };

    updateFrame();
    window.addEventListener('resize', updateFrame);
    window.addEventListener('scroll', updateFrame, true);
    return () => {
      window.removeEventListener('resize', updateFrame);
      window.removeEventListener('scroll', updateFrame, true);
    };
  }, [selectedImage]);

  useEffect(() => {
    if (!dialog) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof Node
        && !dialogRef.current?.contains(target)
        && !dialogTriggerRef.current?.contains(target)
      ) {
        setDialog(null);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, [dialog]);

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

  const getTextOffset = (editor: HTMLElement, container: Node, offset: number) => {
    const range = document.createRange();
    range.selectNodeContents(editor);
    range.setEnd(container, offset);
    return range.toString().length;
  };

  const getTextBoundary = (editor: HTMLElement, offset: number) => {
    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode() as Text | null;
    let lastNode: Text | null = null;
    let remaining = offset;

    while (node) {
      if (remaining <= node.length) return { node, offset: remaining };
      remaining -= node.length;
      lastNode = node;
      node = walker.nextNode() as Text | null;
    }

    return lastNode
      ? { node: lastNode, offset: lastNode.length }
      : { node: editor, offset: 0 };
  };

  const restoreSelectionAtTextOffsets = (
    editor: HTMLElement,
    offsets: { start: number; end: number },
  ) => {
    const selection = window.getSelection();
    if (!selection) return;

    const start = getTextBoundary(editor, offsets.start);
    const end = getTextBoundary(editor, offsets.end);
    const range = document.createRange();
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
    selection.removeAllRanges();
    selection.addRange(range);
    selectionRef.current = range.cloneRange();
  };

  const getCurrentSelectionOffsets = (editor: HTMLElement) => {
    const selection = window.getSelection();
    const liveRange = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const range = liveRange && editor.contains(liveRange.commonAncestorContainer)
      ? liveRange
      : selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)
        ? selectionRef.current
        : null;
    if (!range) return null;

    return {
      start: getTextOffset(editor, range.startContainer, range.startOffset),
      end: getTextOffset(editor, range.endContainer, range.endOffset),
    };
  };

  const applyHistorySnapshot = (html: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    const offsets = getCurrentSelectionOffsets(editor);
    editor.innerHTML = html;
    editor.focus();
    const textLength = editor.textContent?.length ?? 0;
    restoreSelectionAtTextOffsets(
      editor,
      offsets ?? { start: textLength, end: textLength },
    );

    const history = historyRef.current;
    history.currentHtml = html;
    history.lastInputType = '';
    history.lastInputAt = 0;
    setSelectedImage(null);
    setImageFrame(null);
    setSelectedCell(null);
    onChange(html);
    syncToolbarFormat();
  };

  const undoChange = () => {
    const editor = editorRef.current;
    const previousHtml = historyRef.current.undo.pop();
    if (!editor || previousHtml === undefined) return;
    historyRef.current.redo.push(editor.innerHTML);
    applyHistorySnapshot(previousHtml);
  };

  const redoChange = () => {
    const editor = editorRef.current;
    const nextHtml = historyRef.current.redo.pop();
    if (!editor || nextHtml === undefined) return;
    historyRef.current.undo.push(editor.innerHTML);
    applyHistorySnapshot(nextHtml);
  };

  const emitChange = (inputType = '') => {
    const editor = editorRef.current;
    if (!editor) return;

    const history = historyRef.current;
    const html = editor.innerHTML;
    if (html !== history.currentHtml) {
      const now = Date.now();
      const isGroupableInput = [
        'insertText',
        'deleteContentBackward',
        'deleteContentForward',
      ].includes(inputType);
      const canGroup = isGroupableInput
        && history.lastInputType === inputType
        && now - history.lastInputAt < 1000;
      if (!canGroup) history.undo.push(history.currentHtml);
      history.redo = [];
      history.currentHtml = html;
      history.lastInputType = isGroupableInput ? inputType : '';
      history.lastInputAt = isGroupableInput ? now : 0;
    } else if (!inputType) {
      history.lastInputType = '';
      history.lastInputAt = 0;
    }

    onChange(html);
    syncToolbarFormat();
  };

  const readNonNegativeNumber = (input: HTMLInputElement) => {
    const value = input.value.trim();
    const number = Number(value);
    if (!value || !Number.isFinite(number) || number < 0) {
      input.setCustomValidity('Enter a valid non-negative number.');
      input.reportValidity();
      return null;
    }

    input.setCustomValidity('');
    return number;
  };

  const runCommand = (command: EditorCommand, commandValue?: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();
    if (
      command === 'foreColor'
      || command === 'hiliteColor'
    ) {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(command, false, commandValue);
    clearPendingInlineStyle();
    emitChange();
    saveSelection();
  };

  const clearPendingInlineStyle = () => {
    const marker = pendingInlineStyleRef.current;
    if (!marker) return;

    const walker = document.createTreeWalker(marker, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const markerIndex = node.textContent?.indexOf('\u200B') ?? -1;
      if (markerIndex >= 0) {
        node.textContent = `${node.textContent?.slice(0, markerIndex) ?? ''}${node.textContent?.slice(markerIndex + 1) ?? ''}`;
        break;
      }
      node = walker.nextNode();
    }

    if (!marker.textContent) marker.remove();
    pendingInlineStyleRef.current = null;
  };

  const applyInlineStyle = (property: 'fontFamily' | 'fontSize', value: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();
    clearPendingInlineStyle();
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;

    if (range.collapsed) {
      const marker = document.createElement('span');
      marker.style[property] = value;
      marker.append(document.createTextNode('\u200B'));
      range.insertNode(marker);
      const markerText = marker.firstChild;
      if (!(markerText instanceof Text)) {
        marker.remove();
        return;
      }
      range.setStart(markerText, 1);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      selectionRef.current = range.cloneRange();
      pendingInlineStyleRef.current = marker;
      syncToolbarFormat();
      return;
    }

    const reusableSpans = Array.from(editor.querySelectorAll<HTMLElement>('span')).filter((span) => {
      if (!range.intersectsNode(span)) return false;
      const textWalker = document.createTreeWalker(span, NodeFilter.SHOW_TEXT);
      const firstText = textWalker.nextNode() as Text | null;
      if (!firstText) return false;
      let lastText = firstText;
      let nextText = textWalker.nextNode() as Text | null;
      while (nextText) {
        lastText = nextText;
        nextText = textWalker.nextNode() as Text | null;
      }
      const spanRange = document.createRange();
      spanRange.setStart(firstText, 0);
      spanRange.setEnd(lastText, lastText.length);
      const fullySelected = range.compareBoundaryPoints(Range.START_TO_START, spanRange) <= 0
        && range.compareBoundaryPoints(Range.END_TO_END, spanRange) >= 0;
      if (fullySelected) span.style[property] = value;
      return fullySelected;
    });

    const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT);
    const segments: Array<{ node: Text; start: number; end: number }> = [];
    let node = walker.nextNode() as Text | null;
    while (node) {
      if (
        range.intersectsNode(node)
        && !reusableSpans.some((span) => span.contains(node))
      ) {
        const start = range.startContainer === node ? range.startOffset : 0;
        const end = range.endContainer === node ? range.endOffset : node.length;
        if (end > start) segments.push({ node, start, end });
      }
      node = walker.nextNode() as Text | null;
    }

    const spans: HTMLSpanElement[] = [];
    for (const segment of segments) {
      if (segment.end < segment.node.length) segment.node.splitText(segment.end);
      const selectedText = segment.start ? segment.node.splitText(segment.start) : segment.node;
      const span = document.createElement('span');
      span.style[property] = value;
      selectedText.parentNode?.insertBefore(span, selectedText);
      span.append(selectedText);
      spans.push(span);
    }

    if (!spans.length && !reusableSpans.length) return;
    if (spans.length) {
      const updatedRange = document.createRange();
      updatedRange.setStartBefore(spans[0]);
      updatedRange.setEndAfter(spans[spans.length - 1]);
      selection.removeAllRanges();
      selection.addRange(updatedRange);
      selectionRef.current = updatedRange.cloneRange();
    } else {
      selectionRef.current = range.cloneRange();
    }
    emitChange();
  };

  const applyLineSpacing = (lineHeight: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();
    clearPendingInlineStyle();
    const selection = window.getSelection();
    const range = selection?.rangeCount ? selection.getRangeAt(0) : null;
    const blocks = Array.from(editor.querySelectorAll<HTMLElement>(
      'p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div',
    ));
    const selectedBlocks = range && editor.contains(range.commonAncestorContainer)
      ? blocks.filter((block) => range.intersectsNode(block))
      : [];

    if (selectedBlocks.length) {
      selectedBlocks.forEach((block) => {
        block.style.lineHeight = lineHeight;
      });
    } else {
      const selectedElement = range?.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer as HTMLElement
        : range?.startContainer.parentElement;
      const block = selectedElement?.closest<HTMLElement>(
        'p,h1,h2,h3,h4,h5,h6,blockquote,pre,li,div',
      );
      (block ?? editor).style.lineHeight = lineHeight;
    }

    emitChange();
    saveSelection();
  };

  const insertFragmentAtSelection = (fragment: DocumentFragment) => {
    const editor = editorRef.current;
    const selection = window.getSelection();
    if (!editor || !selection) return;

    const currentRange = selection.rangeCount ? selection.getRangeAt(0) : null;
    const savedRange = selectionRef.current;
    const range = currentRange && editor.contains(currentRange.commonAncestorContainer)
      ? currentRange.cloneRange()
      : savedRange && editor.contains(savedRange.commonAncestorContainer)
        ? savedRange.cloneRange()
        : document.createRange();

    if (
      (!currentRange || !editor.contains(currentRange.commonAncestorContainer))
      && (!savedRange || !editor.contains(savedRange.commonAncestorContainer))
    ) {
      range.selectNodeContents(editor);
      range.collapse(false);
    }

    editor.focus();
    range.deleteContents();
    const lastNode = fragment.lastChild;
    range.insertNode(fragment);
    clearPendingInlineStyle();
    if (lastNode) range.setStartAfter(lastNode);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    emitChange();
    saveSelection();
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const html = event.clipboardData.getData('text/html');
    if (!html) return;

    event.preventDefault();
    const sanitizedHtml = normalizePastedHtml(html);
    const template = document.createElement('template');
    template.innerHTML = sanitizedHtml;
    let fragment = template.content;

    if (!fragment.childNodes.length) {
      const plainText = event.clipboardData.getData('text/plain');
      if (!plainText) return;

      fragment = document.createDocumentFragment();
      plainText.split(/\r\n?|\n/).forEach((line, index) => {
        if (index) fragment.append(document.createElement('br'));
        fragment.append(document.createTextNode(line));
      });
    }

    insertFragmentAtSelection(fragment);
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
    syncToolbarFormat();
    if (isFormatPainterActive) pasteFormatting();
  };

  const openDialog = (nextDialog: DialogType, trigger: HTMLElement) => {
    if (dialog === nextDialog && dialogTriggerRef.current === trigger) {
      setDialog(null);
      return;
    }

    const container = editorRef.current?.parentElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const maxLeft = container.clientWidth - 328;
    dialogTriggerRef.current = trigger;
    setDialogPosition({
      top: triggerRect.bottom - containerRect.top - container.clientTop + 6,
      left: Math.max(
        8,
        Math.min(
          triggerRect.left - containerRect.left - container.clientLeft,
          maxLeft,
        ),
      ),
    });
    setDialog(nextDialog);
  };

  const openLinkDialog = (trigger?: HTMLElement) => {
    setLinkUrl('');
    const anchor = trigger
      ?? editorRef.current?.parentElement?.querySelector<HTMLButtonElement>('[aria-label="Add link"]');
    if (anchor) openDialog('link', anchor);
  };

  const openImageDialog = (trigger: HTMLButtonElement) => {
    setImageUrl('');
    setImageAlt('');
    setImageUrlError('');
    openDialog('image', trigger);
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
    setSelectedImage(null);
    setSelectedCell(null);
    setDialog(null);
  };

  const insertTable = (rows: number, columns: number) => {
    const header = `<tr>${'<th><br></th>'.repeat(columns)}</tr>`;
    const body = Array.from({ length: rows - 1 }, () => (
      `<tr>${'<td><br></td>'.repeat(columns)}</tr>`
    )).join('');
    runCommand('insertHTML', `<table><thead>${header}</thead><tbody>${body}</tbody></table><p><br></p>`);
    setSelectedImage(null);
    setSelectedCell(null);
    setDialog(null);
  };

  const focusTableCell = (cell: HTMLTableCellElement) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(true);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    selectionRef.current = range.cloneRange();
    setSelectedCell(cell);
    setSelectedImage(null);
  };

  const insertTableRow = (position: 'above' | 'below') => {
    if (!selectedCell) return;
    const table = selectedCell.closest('table');
    const row = selectedCell.closest('tr');
    if (!table || !row) return;

    const newRow = document.createElement('tr');
    const count = table.rows[0]?.cells.length ?? 0;
    for (let index = 0; index < count; index += 1) {
      const currentCell = row.cells.item(index);
      const newCell = document.createElement(currentCell?.tagName.toLowerCase() === 'th' ? 'th' : 'td');
      newCell.innerHTML = '<br>';
      newRow.append(newCell);
    }

    if (position === 'above') row.before(newRow);
    else row.after(newRow);
    focusTableCell(newRow.cells.item(selectedCell.cellIndex) ?? newRow.cells[0]);
    emitChange();
  };

  const removeTableRow = () => {
    if (!selectedCell) return;
    const table = selectedCell.closest('table');
    const row = selectedCell.closest('tr');
    if (!table || !row || table.rows.length <= 1) return;

    const rowIndex = row.rowIndex;
    const columnIndex = selectedCell.cellIndex;
    row.remove();
    const nextRow = table.rows[Math.min(rowIndex, table.rows.length - 1)];
    const nextCell = nextRow.cells.item(Math.min(columnIndex, nextRow.cells.length - 1));
    if (nextCell) focusTableCell(nextCell);
    emitChange();
  };

  const insertTableColumn = (position: 'before' | 'after') => {
    if (!selectedCell) return;
    const table = selectedCell.closest('table');
    if (!table || !isSimpleTable(table)) return;

    const row = selectedCell.closest('tr');
    const columnIndex = selectedCell.cellIndex + (position === 'after' ? 1 : 0);
    for (const row of Array.from(table.rows)) {
      const referenceCell = row.cells.item(columnIndex);
      const existingCell = row.cells.item(Math.min(columnIndex, row.cells.length - 1));
      const newCell = document.createElement(existingCell?.tagName.toLowerCase() === 'th' ? 'th' : 'td');
      newCell.innerHTML = '<br>';
      if (referenceCell) row.insertBefore(newCell, referenceCell);
      else row.append(newCell);
    }

    const insertedCell = row?.cells.item(columnIndex) ?? table.rows[0]?.cells.item(columnIndex);
    if (insertedCell) focusTableCell(insertedCell);
    emitChange();
  };

  const removeTableColumn = () => {
    if (!selectedCell) return;
    const table = selectedCell.closest('table');
    if (!table || !isSimpleTable(table) || table.rows[0].cells.length <= 1) return;

    const columnIndex = selectedCell.cellIndex;
    const row = selectedCell.closest('tr');
    for (const row of Array.from(table.rows)) row.cells.item(columnIndex)?.remove();
    const currentRow = row ?? table.rows[0];
    const nextCell = currentRow?.cells.item(Math.min(columnIndex, (currentRow.cells.length ?? 1) - 1));
    if (nextCell) focusTableCell(nextCell);
    emitChange();
  };

  const deleteTable = () => {
    const table = selectedCell?.closest('table');
    if (!table) return;
    table.remove();
    setSelectedCell(null);
    setDialog(null);
    emitChange();
  };

  const alignSelectedImage = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImage || !editorRef.current?.contains(selectedImage)) return;
    selectedImage.style.display = 'block';
    selectedImage.style.marginLeft = alignment === 'left' ? '0' : 'auto';
    selectedImage.style.marginRight = alignment === 'right' ? '0' : 'auto';
    setImageFrame(getImageFrame(selectedImage));
    emitChange();
  };

  const startImageResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!selectedImage) return;
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    imageResizeRef.current = {
      image: selectedImage,
      pointerX: event.clientX,
      width: selectedImage.getBoundingClientRect().width,
    };
  };

  const moveImageResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    const resize = imageResizeRef.current;
    const editor = editorRef.current;
    if (!resize || !editor) return;

    event.preventDefault();
    const maxWidth = getImageMaxWidth();
    const width = Math.min(maxWidth, Math.max(32, resize.width + event.clientX - resize.pointerX));
    resize.image.style.width = `${Math.round(width)}px`;
    resize.image.style.height = 'auto';
    setImageFrame(getImageFrame(resize.image));
  };

  const finishImageResize = () => {
    if (!imageResizeRef.current) return;
    imageResizeRef.current = null;
    emitChange();
  };

  const resizeImageWithKeyboard = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!selectedImage || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
    event.preventDefault();
    const step = event.shiftKey ? 20 : 5;
    const maxWidth = getImageMaxWidth();
    const width = selectedImage.getBoundingClientRect().width
      + (event.key === 'ArrowRight' ? step : -step);
    selectedImage.style.width = `${Math.round(Math.min(maxWidth, Math.max(32, width)))}px`;
    selectedImage.style.height = 'auto';
    setImageFrame(getImageFrame(selectedImage));
    emitChange();
  };

  const handleEditorPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!features.table || event.button !== 0 || !(event.target instanceof Element)) return;
    const cell = event.target.closest<HTMLTableCellElement>('td,th');
    const table = cell?.closest('table');
    if (!cell || !table || !isSimpleTable(table)) return;

    const columnIndex = cell.cellIndex;
    const firstRow = table.rows[0];
    if (columnIndex >= firstRow.cells.length - 1) return;
    const cellRect = cell.getBoundingClientRect();
    if (cellRect.right - event.clientX > 6) return;

    const leftWidth = firstRow.cells.item(columnIndex)?.getBoundingClientRect().width ?? 0;
    const rightWidth = firstRow.cells.item(columnIndex + 1)?.getBoundingClientRect().width ?? 0;
    if (!leftWidth || !rightWidth) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = 'col-resize';
    columnResizeRef.current = { table, columnIndex, pointerX: event.clientX, leftWidth, rightWidth };
    setSelectedCell(cell);
    setSelectedImage(null);
  };

  const handleEditorPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!features.table) {
      event.currentTarget.style.cursor = '';
      return;
    }

    const resize = columnResizeRef.current;
    if (!resize) {
      const target = event.target;
      const cell = target instanceof Element
        ? target.closest<HTMLTableCellElement>('td,th')
        : null;
      const table = cell?.closest('table');
      const nearEdge = Boolean(
        cell
        && table
        && isSimpleTable(table)
        && cell.cellIndex < table.rows[0].cells.length - 1
        && cell.getBoundingClientRect().right - event.clientX >= 0
        && cell.getBoundingClientRect().right - event.clientX <= 6,
      );
      event.currentTarget.style.cursor = nearEdge ? 'col-resize' : '';
      return;
    }

    event.preventDefault();
    const delta = event.clientX - resize.pointerX;
    const minimumWidth = 64;
    const adjustment = Math.max(
      minimumWidth - resize.leftWidth,
      Math.min(resize.rightWidth - minimumWidth, delta),
    );
    const leftWidth = resize.leftWidth + adjustment;
    const rightWidth = resize.rightWidth - adjustment;
    resize.table.style.tableLayout = 'fixed';
    for (const row of Array.from(resize.table.rows)) {
      const leftCell = row.cells.item(resize.columnIndex);
      const rightCell = row.cells.item(resize.columnIndex + 1);
      if (leftCell && rightCell) {
        leftCell.style.width = `${Math.round(leftWidth)}px`;
        rightCell.style.width = `${Math.round(rightWidth)}px`;
      }
    }
  };

  const finishTableResize = () => {
    if (!columnResizeRef.current) return;
    columnResizeRef.current = null;
    if (editorRef.current) editorRef.current.style.cursor = '';
    emitChange();
  };

  const handleEditorClick = (event: React.MouseEvent<HTMLDivElement>) => {
    saveSelection();
    syncToolbarFormat();
    if (!(event.target instanceof Element)) return;
    if (pendingInlineStyleRef.current && !pendingInlineStyleRef.current.contains(event.target)) {
      clearPendingInlineStyle();
    }

    const image = event.target.closest('img');
    if (image instanceof HTMLImageElement && editorRef.current?.contains(image)) {
      setSelectedImage(features.image ? image : null);
      setSelectedCell(null);
      return;
    }

    const cell = event.target.closest('td,th');
    if (cell instanceof HTMLTableCellElement && editorRef.current?.contains(cell)) {
      setSelectedCell(features.table ? cell : null);
      setSelectedImage(null);
      return;
    }

    setSelectedImage(null);
    setSelectedCell(null);
  };

  const handleEditorInput = (event: React.FormEvent<HTMLDivElement>) => {
    clearPendingInlineStyle();
    const nativeEvent = event.nativeEvent;
    emitChange(nativeEvent instanceof InputEvent ? nativeEvent.inputType : '');
  };

  const insertInlineCode = () => {
    restoreSelection();
    const selection = window.getSelection();
    const selectedText = selection?.toString() ?? '';
    const content = selectedText ? escapeHtml(selectedText) : '<br>';
    runCommand('insertHTML', `<code>${content}</code>`);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        if (features.redo) redoChange();
      } else if (features.undo) {
        undoChange();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === 'y') {
      event.preventDefault();
      if (features.redo) redoChange();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && ['b', 'i', 'u'].includes(key)) {
      event.preventDefault();
      if (key === 'b' && features.bold) runCommand('bold');
      if (key === 'i' && features.italic) runCommand('italic');
      if (key === 'u' && features.underline) runCommand('underline');
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      if (features.link) {
        saveSelection();
        openLinkDialog();
      }
      return;
    }

    if (!markdownShortcuts || event.key !== ' ') return;

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
    if (shortcut.command === 'formatBlock' && !features.blockFormat) return;
    if (shortcut.command === 'insertUnorderedList' && !features.bulletedList) return;
    if (shortcut.command === 'insertOrderedList' && !features.numberedList) return;
    event.preventDefault();
    document.execCommand('delete');
    document.execCommand(shortcut.command, false, shortcut.value);
    emitChange();
    saveSelection();
  };

  const toggleHtmlSource = () => {
    setDialog(null);
    setIsFormatPainterActive(false);
    if (isSourceEditing) {
      if (htmlSourceDraft !== value) onChange(htmlSourceDraft);
      setIsSourceEditing(false);
    } else {
      setHtmlSourceDraft(formatHtml(value));
      setIsSourceEditing(true);
    }
  };

  const button = (
    label: string,
    icon: IconName,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void,
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

  const selectedTable = selectedCell?.closest('table') ?? null;
  const selectedTableIsSimple = selectedTable ? isSimpleTable(selectedTable) : false;
  const fontSizePreset = fontSizes.find(({ value: size }) => (
    Number.parseFloat(size) === Number.parseFloat(toolbarFormat.fontSize)
  ))?.value ?? '';
  const lineSpacingPreset = lineSpacings.some(({ value }) => (
    value === toolbarFormat.lineSpacing
  ))
    ? toolbarFormat.lineSpacing
    : '';
  const fontFamilyIsPreset = fontFamilies.some(({ value: font }) => (
    font.toLowerCase() === toolbarFormat.fontFamily.toLowerCase()
  ));

  return (
    <div className={['rwe', isDarkTheme && 'rwe--dark', className].filter(Boolean).join(' ')}>
      <div className="rwe__toolbar" role="toolbar" aria-label="Text formatting">
        {features.blockFormat && (
        <div className="rwe__group">
          <select
            className="rwe__select"
            aria-label="Block format"
            value={toolbarFormat.blockFormat}
            disabled={isSourceEditing}
            onMouseDown={saveSelection}
            onChange={(event) => {
              if (event.target.value) runCommand('formatBlock', event.target.value);
            }}
          >
            <option value="" disabled>Block</option>
            {blockFormats.map(({ value: format, label }) => (
              <option key={format} value={format}>{label}</option>
            ))}
          </select>
        </div>
        )}
        {(features.fontFamily || features.fontSize || features.lineSpacing) && (
        <div className="rwe__group">
          {features.fontFamily && (
          <select
            className="rwe__select"
            aria-label="Font family"
            value={toolbarFormat.fontFamily}
            disabled={isSourceEditing}
            onMouseDown={saveSelection}
            onChange={(event) => {
              if (event.target.value) applyInlineStyle('fontFamily', event.target.value);
            }}
          >
            <option value="" disabled>Font</option>
            {toolbarFormat.fontFamily && !fontFamilyIsPreset && (
              <option value={toolbarFormat.fontFamily}>{toolbarFormat.fontFamily}</option>
            )}
            {fontFamilies.map(({ value: font, label }) => (
              <option key={font} value={font}>{label}</option>
            ))}
          </select>
          )}
          {features.fontSize && (
          <>
          <select
            className="rwe__select"
            aria-label="Font size"
            value={fontSizePreset}
            disabled={isSourceEditing}
            onMouseDown={saveSelection}
            onChange={(event) => {
              if (event.target.value) applyInlineStyle('fontSize', event.target.value);
            }}
          >
            <option value="" disabled>Size</option>
            {fontSizes.map(({ value: size, label }) => (
              <option key={size} value={size}>{label}</option>
            ))}
          </select>
          <input
            className="rwe__custom-number"
            aria-label="Custom font size in pixels"
            title="Enter a font size, then press Enter"
            type="text"
            inputMode="decimal"
            disabled={isSourceEditing}
            placeholder="px"
            value={customFontSizeDraft ?? (fontSizePreset ? '' : toolbarFormat.fontSize)}
            onMouseDown={saveSelection}
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              setCustomFontSizeDraft(event.target.value);
            }}
            onBlur={(event) => {
              event.currentTarget.setCustomValidity('');
              setCustomFontSizeDraft(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              const fontSize = readNonNegativeNumber(event.currentTarget);
              if (fontSize === null) return;
              applyInlineStyle('fontSize', `${fontSize}px`);
              setCustomFontSizeDraft(null);
            }}
          />
          </>
          )}
          {features.lineSpacing && (
          <>
          <select
            className="rwe__select"
            aria-label="Line spacing"
            value={lineSpacingPreset}
            disabled={isSourceEditing}
            onMouseDown={saveSelection}
            onChange={(event) => {
              if (event.target.value) applyLineSpacing(event.target.value);
            }}
          >
            <option value="" disabled>Spacing</option>
            {lineSpacings.map(({ value: spacing, label }) => (
              <option key={spacing} value={spacing}>{label}</option>
            ))}
          </select>
          <input
            className="rwe__custom-number"
            aria-label="Custom line spacing"
            title="Enter a line-spacing multiplier, then press Enter"
            type="text"
            inputMode="decimal"
            disabled={isSourceEditing}
            placeholder="×"
            value={customLineSpacingDraft ?? (lineSpacingPreset ? '' : toolbarFormat.lineSpacing)}
            onMouseDown={saveSelection}
            onChange={(event) => {
              event.currentTarget.setCustomValidity('');
              setCustomLineSpacingDraft(event.target.value);
            }}
            onBlur={(event) => {
              event.currentTarget.setCustomValidity('');
              setCustomLineSpacingDraft(null);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter') return;
              event.preventDefault();
              const lineSpacing = readNonNegativeNumber(event.currentTarget);
              if (lineSpacing === null) return;
              applyLineSpacing(String(lineSpacing));
              setCustomLineSpacingDraft(null);
            }}
          />
          </>
          )}
        </div>
        )}
        {(features.bold || features.italic || features.underline || features.strikeThrough
          || features.subscript || features.superscript || features.inlineCode || features.clearFormatting) && (
        <div className="rwe__group">
          {features.bold && button('Bold', 'bold', () => runCommand('bold'), 'Ctrl+B', false, toolbarFormat.bold)}
          {features.italic && button('Italic', 'italic', () => runCommand('italic'), 'Ctrl+I', false, toolbarFormat.italic)}
          {features.underline && button('Underline', 'underline', () => runCommand('underline'), undefined, false, toolbarFormat.underline)}
          {features.strikeThrough && button('Strikethrough', 'strike', () => runCommand('strikeThrough'), undefined, false, toolbarFormat.strikeThrough)}
          {features.subscript && button('Subscript', 'subscript', () => runCommand('subscript'), undefined, false, toolbarFormat.subscript)}
          {features.superscript && button('Superscript', 'superscript', () => runCommand('superscript'), undefined, false, toolbarFormat.superscript)}
          {features.inlineCode && button('Inline code', 'code', insertInlineCode)}
          {features.clearFormatting && button('Clear formatting', 'clear', () => runCommand('removeFormat'))}
        </div>
        )}
        {(features.bulletedList || features.numberedList || features.table || features.image || features.horizontalRule) && (
        <div className="rwe__group">
          {features.bulletedList && button('Bulleted list', 'bulletedList', () => runCommand('insertUnorderedList'), undefined, false, toolbarFormat.bulletedList)}
          {features.numberedList && button('Numbered list', 'numberedList', () => runCommand('insertOrderedList'), undefined, false, toolbarFormat.numberedList)}
          {features.table && button('Insert table', 'table', (event) => openDialog('table', event.currentTarget))}
          {features.image && button('Insert image', 'image', (event) => openImageDialog(event.currentTarget))}
          {features.horizontalRule && button('Horizontal rule', 'rule', () => runCommand('insertHorizontalRule'))}
        </div>
        )}
        {(features.textAlignment || features.indentation) && (
        <div className="rwe__group">
          {features.textAlignment && button('Align left', 'alignLeft', () => runCommand('justifyLeft'), undefined, false, ['left', 'start'].includes(toolbarFormat.textAlign))}
          {features.textAlignment && button('Align center', 'alignCenter', () => runCommand('justifyCenter'), undefined, false, toolbarFormat.textAlign === 'center')}
          {features.textAlignment && button('Align right', 'alignRight', () => runCommand('justifyRight'), undefined, false, ['right', 'end'].includes(toolbarFormat.textAlign))}
          {features.textAlignment && button('Justify', 'justify', () => runCommand('justifyFull'), undefined, false, toolbarFormat.textAlign === 'justify')}
          {features.indentation && button('Decrease indent', 'outdent', () => runCommand('outdent'))}
          {features.indentation && button('Increase indent', 'indent', () => runCommand('indent'))}
        </div>
        )}
        {features.image && selectedImage && (
          <div className="rwe__group" aria-label="Image alignment">
            {button('Align image left', 'alignLeft', () => alignSelectedImage('left'))}
            {button('Center image', 'alignCenter', () => alignSelectedImage('center'))}
            {button('Align image right', 'alignRight', () => alignSelectedImage('right'))}
          </div>
        )}
        {(features.textColor || features.highlight) && (
        <div className="rwe__group">
          {features.textColor && (
          <label className="rwe__color">
            Text
            <input
              aria-label="Text color"
              type="color"
              value={toolbarFormat.textColor}
              disabled={isSourceEditing}
              onMouseDown={saveSelection}
              onChange={(event) => runCommand('foreColor', event.target.value)}
            />
          </label>
          )}
          {features.highlight && (
          <label className="rwe__color">
            Highlight
            <input
              aria-label="Highlight color"
              type="color"
              value={toolbarFormat.highlightColor}
              disabled={isSourceEditing}
              onMouseDown={saveSelection}
              onChange={(event) => runCommand('hiliteColor', event.target.value)}
            />
          </label>
          )}
        </div>
        )}
        {(features.link || features.undo || features.redo || features.formatPainter || features.htmlSource) && (
        <div className="rwe__group">
          {features.link && button('Add link', 'link', (event) => openLinkDialog(event.currentTarget), 'Ctrl+K')}
          {features.link && button('Remove link', 'unlink', () => runCommand('unlink'))}
          {features.undo && button('Undo', 'undo', () => undoChange(), 'Ctrl+Z')}
          {features.redo && button('Redo', 'redo', () => redoChange(), 'Ctrl+Y')}
          {features.formatPainter && button(
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
          {features.htmlSource && button(
            isSourceEditing ? 'Visual editor' : 'Edit HTML',
            'code',
            toggleHtmlSource,
          )}
        </div>
        )}
        {features.table && selectedTable && (
          <div className="rwe__group">
            {button('Table options', 'table', (event) => openDialog('table-tools', event.currentTarget))}
          </div>
        )}
      </div>
      {dialog === 'link' && (
        <form
          ref={dialogRef}
          className="rwe__dialog"
          aria-label="Insert link"
          style={dialogPosition}
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
          ref={dialogRef}
          className="rwe__dialog"
          aria-label="Insert image"
          style={dialogPosition}
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
          ref={dialogRef}
          className="rwe__dialog"
          aria-label="Insert table"
          style={dialogPosition}
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
      {dialog === 'table-tools' && selectedTable && selectedCell && (
        <form
          ref={dialogRef}
          className="rwe__dialog rwe__table-dialog"
          aria-label="Edit table"
          style={dialogPosition}
          onSubmit={(event) => event.preventDefault()}
        >
          <p className="rwe__dialog-hint">Drag a cell boundary to resize its column.</p>
          {!selectedTableIsSimple && (
            <p className="rwe__dialog-hint" role="status">
              Row and column editing is unavailable for merged cells.
            </p>
          )}
          <div className="rwe__table-tools">
            <button type="button" disabled={!selectedTableIsSimple} onClick={() => insertTableRow('above')}>
              Insert row above
            </button>
            <button type="button" disabled={!selectedTableIsSimple} onClick={() => insertTableRow('below')}>
              Insert row below
            </button>
            <button
              type="button"
              disabled={!selectedTableIsSimple || selectedTable.rows.length <= 1}
              onClick={removeTableRow}
            >
              Remove row
            </button>
            <button type="button" disabled={!selectedTableIsSimple} onClick={() => insertTableColumn('before')}>
              Insert column before
            </button>
            <button type="button" disabled={!selectedTableIsSimple} onClick={() => insertTableColumn('after')}>
              Insert column after
            </button>
            <button
              type="button"
              disabled={!selectedTableIsSimple || selectedTable.rows[0].cells.length <= 1}
              onClick={removeTableColumn}
            >
              Remove column
            </button>
            <button className="rwe__table-delete" type="button" onClick={deleteTable}>
              Delete table
            </button>
          </div>
        </form>
      )}
      <textarea
        className="rwe__source"
        aria-label="HTML source"
        hidden={!isSourceEditing}
        spellCheck={false}
        style={{
          height,
          minHeight: height === 'auto' ? undefined : 0,
          overflowY: height === 'auto' ? 'visible' : 'auto',
          resize: height === 'auto' ? 'vertical' : 'none',
        }}
        value={htmlSourceDraft}
        onChange={(event) => {
          setHtmlSourceDraft(event.currentTarget.value);
          onChange(event.currentTarget.value);
        }}
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
        style={{
          height,
          minHeight: height === 'auto' ? undefined : 0,
          overflowY: height === 'auto' ? 'visible' : 'auto',
        }}
        onFocus={onFocus}
        onInput={handleEditorInput}
        onKeyDown={handleKeyDown}
        onKeyUp={handleEditorSelection}
        onMouseUp={handleEditorSelection}
        onClick={handleEditorClick}
        onPaste={handlePaste}
        onPointerDown={handleEditorPointerDown}
        onPointerMove={handleEditorPointerMove}
        onPointerUp={finishTableResize}
        onPointerCancel={finishTableResize}
        onPointerLeave={(event) => {
          if (!columnResizeRef.current) event.currentTarget.style.cursor = '';
        }}
        onBlur={(event) => {
          onBlur?.(event);
          const nextTarget = event.relatedTarget;
          if (!(nextTarget instanceof Node && event.currentTarget.parentElement?.contains(nextTarget))) {
            clearPendingInlineStyle();
          }
        }}
      />
      {selectedImage && imageFrame && !isSourceEditing && (
        <div
          className="rwe__image-selection"
          style={{
            height: imageFrame.height,
            left: imageFrame.left,
            top: imageFrame.top,
            width: imageFrame.width,
          }}
        >
          <button
            className="rwe__image-resize-handle"
            type="button"
            aria-label="Resize image"
            title="Drag or use arrow keys to resize"
            onPointerDown={startImageResize}
            onPointerMove={moveImageResize}
            onPointerUp={finishImageResize}
            onPointerCancel={finishImageResize}
            onKeyDown={resizeImageWithKeyboard}
          />
        </div>
      )}
    </div>
  );
}
