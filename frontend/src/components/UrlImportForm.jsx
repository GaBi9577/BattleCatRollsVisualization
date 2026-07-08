import { useState } from 'react';
import { parseGodfatUrl } from '../utils/urlParser';

/**
 * 貼網址轉種子的表單。
 * @param {{ onParsed: (result: { seed: string, lang: string }) => void }} props
 */
export default function UrlImportForm({ onParsed }) {
  const [rawUrl, setRawUrl] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(event) {
    event.preventDefault();
    const parsed = parseGodfatUrl(rawUrl);

    if (!parsed) {
      setError('看不出來這是有效的網址，請確認網址裡有 seed 參數。');
      return;
    }

    setError('');
    onParsed(parsed);
  }

  return (
    <form className="card url-import-form" onSubmit={handleSubmit}>
      <label htmlFor="raw-url">貼上 bc.godfat.org 網址</label>
      <div className="url-import-row">
        <input
          id="raw-url"
          type="text"
          placeholder="https://bc.godfat.org/?seed=...&lang=tw"
          value={rawUrl}
          onChange={(event) => setRawUrl(event.target.value)}
        />
        <button type="submit">解析網址</button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </form>
  );
}
