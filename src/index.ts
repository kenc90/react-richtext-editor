import styles from './style.css?inline';

const styleId = 'react-wysiwyg-default-styles';
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = styles;
  document.head.append(style);
}

export { RichTextEditor } from './RichTextEditor';
export type { RichTextEditorProps } from './RichTextEditor';
