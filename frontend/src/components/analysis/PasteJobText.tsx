import React, { useState } from 'react';
import { ClipboardPaste, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface PasteJobTextProps {
  onExtractText: (rawText: string) => Promise<void>;
  isLoading: boolean;
}

const MAX_PASTE_CHARS = 25000;

export const PasteJobText: React.FC<PasteJobTextProps> = ({
  onExtractText,
  isLoading,
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length < 30) {
      setError('Please paste at least 30 characters of the job offer text.');
      return;
    }
    setError(null);
    await onExtractText(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="pasteJobTextArea" className="label-base">
            Copied Job Offer Text <span className="text-red-400">*</span>
          </label>
          <span className="font-mono text-[11px] text-ink-secondary">
            {text.length}/{MAX_PASTE_CHARS}
          </span>
        </div>
        <textarea
          id="pasteJobTextArea"
          rows={8}
          value={text}
          maxLength={MAX_PASTE_CHARS}
          disabled={isLoading}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste the full job offer email, PDF text, or recruitment message here..."
          className={`input-base ${error ? 'border-crimson focus:border-crimson focus:ring-crimson' : ''}`}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading || !text}
          onClick={() => {
            setText('');
            setError(null);
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Clear Text
        </Button>

        <Button type="submit" variant="primary" isLoading={isLoading}>
          <ClipboardPaste className="h-4 w-4" />
          {isLoading ? 'Extracting Details...' : 'Extract & Review Text'}
        </Button>
      </div>
    </form>
  );
};
