import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { RichTextEditor } from './RichTextEditor';
import './style.css';

function Demo() {
  const [value, setValue] = useState(
    '<h2>Try the editor</h2><p>Select text and try the toolbar, or type <strong>#</strong>, <strong>&gt;</strong>, <strong>-</strong>, or <strong>1.</strong> followed by a space for a Markdown shortcut.</p>',
  );

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', margin: '3rem auto', maxWidth: 960, padding: '0 1rem' }}>
      <h1>react-wysiwyg</h1>
      <RichTextEditor value={value} onChange={setValue} />
      <h2>HTML output</h2>
      <pre className="rwe-demo__output">{value}</pre>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Demo />);
