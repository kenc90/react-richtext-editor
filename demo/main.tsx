import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RichTextEditor, type RichTextEditorFeatures } from '../src/RichTextEditor';
import './demo.css';
import '../src/style.css';

const featureGroups: Array<{
  label: string;
  features: Array<{ key: keyof RichTextEditorFeatures; label: string }>;
}> = [
  {
    label: 'Text style',
    features: [
      { key: 'blockFormat', label: 'Block format' },
      { key: 'fontFamily', label: 'Font family' },
      { key: 'fontSize', label: 'Font size' },
      { key: 'lineSpacing', label: 'Line spacing' },
    ],
  },
  {
    label: 'Inline formatting',
    features: [
      { key: 'bold', label: 'Bold' },
      { key: 'italic', label: 'Italic' },
      { key: 'underline', label: 'Underline' },
      { key: 'strikeThrough', label: 'Strikethrough' },
      { key: 'subscript', label: 'Subscript' },
      { key: 'superscript', label: 'Superscript' },
      { key: 'inlineCode', label: 'Inline code' },
      { key: 'clearFormatting', label: 'Clear formatting' },
    ],
  },
  {
    label: 'Content',
    features: [
      { key: 'bulletedList', label: 'Bulleted list' },
      { key: 'numberedList', label: 'Numbered list' },
      { key: 'table', label: 'Table' },
      { key: 'image', label: 'Image' },
      { key: 'horizontalRule', label: 'Horizontal rule' },
      { key: 'link', label: 'Links' },
    ],
  },
  {
    label: 'Layout and color',
    features: [
      { key: 'textAlignment', label: 'Text alignment' },
      { key: 'indentation', label: 'Indentation' },
      { key: 'textColor', label: 'Text color' },
      { key: 'highlight', label: 'Highlight' },
    ],
  },
  {
    label: 'Editor tools',
    features: [
      { key: 'undo', label: 'Undo' },
      { key: 'redo', label: 'Redo' },
      { key: 'formatPainter', label: 'Format painter' },
      { key: 'htmlSource', label: 'HTML source' },
    ],
  },
];

function Demo() {
  const [value, setValue] = useState(
    '<h2>Try the editor</h2><p>Select text and try the toolbar, or type <strong>#</strong>, <strong>&gt;</strong>, <strong>-</strong>, or <strong>1.</strong> followed by a space for a Markdown shortcut.</p>',
  );
  const [features, setFeatures] = useState<RichTextEditorFeatures>({});
  const [markdownShortcuts, setMarkdownShortcuts] = useState(false);
  const [isFeatureDialogOpen, setIsFeatureDialogOpen] = useState(false);
  const featureDialogRef = useRef<HTMLDialogElement>(null);
  const disabledFeatureCount = Object.values(features).filter((enabled) => enabled === false).length;

  useEffect(() => {
    const dialog = featureDialogRef.current;
    if (!dialog) return;
    if (isFeatureDialogOpen && !dialog.open) dialog.showModal();
    if (!isFeatureDialogOpen && dialog.open) dialog.close();
  }, [isFeatureDialogOpen]);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '3rem auto', maxWidth: 960, padding: '0 1rem' }}>
      <h1>react-richtext-editor</h1>
      <div className="rwe-demo__feature-toolbar">
        <button type="button" onClick={() => setIsFeatureDialogOpen(true)}>
          Configure editor features
        </button>
        <span>{disabledFeatureCount} disabled</span>
        <label className="rwe-demo__shortcut-toggle">
          <input
            type="checkbox"
            checked={markdownShortcuts}
            onChange={(event) => setMarkdownShortcuts(event.target.checked)}
          />
          Markdown shortcuts
        </label>
      </div>
      <RichTextEditor
        value={value}
        onChange={setValue}
        features={features}
        markdownShortcuts={markdownShortcuts}
      />
      <dialog
        ref={featureDialogRef}
        className="rwe-demo__feature-dialog"
        aria-labelledby="rwe-demo-feature-title"
        onClose={() => setIsFeatureDialogOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) setIsFeatureDialogOpen(false);
        }}
      >
        <header className="rwe-demo__feature-header">
          <div>
            <h2 id="rwe-demo-feature-title">Editor features</h2>
            <p>Toggle features to see how the editor configuration changes.</p>
          </div>
          <button
            type="button"
            className="rwe-demo__feature-close"
            aria-label="Close feature settings"
            onClick={() => setIsFeatureDialogOpen(false)}
          >
            ×
          </button>
        </header>
        <div className="rwe-demo__feature-actions">
          <button type="button" onClick={() => setFeatures({})}>Enable all</button>
          <button
            type="button"
            onClick={() => {
              const disabledFeatures = featureGroups.reduce<RichTextEditorFeatures>((result, group) => {
                group.features.forEach(({ key }) => {
                  result[key] = false;
                });
                return result;
              }, {});
              setFeatures(disabledFeatures);
            }}
          >
            Disable all
          </button>
        </div>
        <div className="rwe-demo__feature-groups">
          {featureGroups.map((group) => (
            <fieldset key={group.label}>
              <legend>{group.label}</legend>
              {group.features.map(({ key, label }) => (
                <label key={key}>
                  <input
                    type="checkbox"
                    checked={features[key] !== false}
                    onChange={(event) => {
                      setFeatures((current) => ({ ...current, [key]: event.target.checked }));
                    }}
                  />
                  {label}
                </label>
              ))}
            </fieldset>
          ))}
        </div>
        <footer className="rwe-demo__feature-footer">
          <button type="button" onClick={() => setIsFeatureDialogOpen(false)}>Done</button>
        </footer>
      </dialog>
      <h2>HTML output</h2>
      <pre className="rwe-demo__output">{value}</pre>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Demo />);
