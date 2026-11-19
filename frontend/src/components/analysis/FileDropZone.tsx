import React, { useRef, useState } from 'react';
import {
  FileText,
  RefreshCw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { AlertBanner } from '../ui/AlertBanner';
import { Button } from '../ui/Button';

export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

interface FileDropZoneProps {
  selectedFile: File | null;
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  disabled?: boolean;
  onClipboardFallback?: (message: string) => void;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export const FileDropZone: React.FC<FileDropZoneProps> = ({
  selectedFile,
  onFileSelected,
  onFileRemoved,
  disabled = false,
  onClipboardFallback,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [clipboardNotice, setClipboardNotice] = useState<string | null>(null);

  const validateAndAccept = (file: File) => {
    setFileError(null);
    setClipboardNotice(null);

    const isPdfMime = file.type === 'application/pdf';
    const isPdfExt = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfMime && !isPdfExt) {
      setFileError('Only PDF (.pdf) documents are supported.');
      return;
    }

    if (file.size === 0) {
      setFileError('The selected PDF file is empty (0 bytes).');
      return;
    }

    if (file.size > MAX_PDF_SIZE_BYTES) {
      setFileError(
        `File exceeds the ${formatBytes(MAX_PDF_SIZE_BYTES)} maximum size limit (${formatBytes(file.size)}).`
      );
      return;
    }

    onFileSelected(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndAccept(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    const files = Array.from(e.clipboardData?.files ?? []);
    const pdfFromFiles = files.find(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFromFiles) {
      e.preventDefault();
      validateAndAccept(pdfFromFiles);
      return;
    }

    const items = Array.from(e.clipboardData?.items ?? []);
    const pdfItem = items.find(
      (item) => item.kind === 'file' && item.type === 'application/pdf'
    );
    if (pdfItem) {
      const file = pdfItem.getAsFile();
      if (file) {
        e.preventDefault();
        validateAndAccept(file);
        return;
      }
    }

    // Browser/OS did not expose a PDF file in ClipboardEvent
    const pastedText = e.clipboardData?.getData('text/plain')?.trim();
    if (pastedText) {
      const msg =
        'Your clipboard contains plain text rather than a PDF file. Switch to the "Paste Text" tab to analyse copied text, or use Browse PDF.';
      setClipboardNotice(msg);
      onClipboardFallback?.(msg);
    } else {
      const msg =
        'Your browser did not expose a PDF file from the clipboard. Please drag and drop the PDF or use the Browse PDF button.';
      setClipboardNotice(msg);
      onClipboardFallback?.(msg);
    }
  };

  return (
    <div className="space-y-3" onPaste={handlePaste} tabIndex={0}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) validateAndAccept(file);
          e.target.value = '';
        }}
      />

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload PDF job offer via drag and drop, browse, or paste"
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-ink-primary ${
            isDragging
              ? 'border-crimson bg-crimson/10'
              : 'border-border bg-canvas hover:border-border-strong hover:bg-subtle/60'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-subtle text-ink-primary">
            <UploadCloud className="h-6 w-6 text-crimson" />
          </div>
          <p className="text-sm font-semibold text-ink-primary">
            Drag and drop your job offer PDF here
          </p>
          <p className="mt-1 text-xs text-ink-secondary">
            Or click to browse, or press <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[11px]">Cmd/Ctrl + V</kbd> to paste a copied PDF file
          </p>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                inputRef.current?.click();
              }}
            >
              Browse PDF
            </Button>
          </div>

          <p className="mt-4 font-mono text-[11px] text-ink-secondary">
            Supported format: PDF (.pdf) · Maximum size: 10 MB
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-xl border border-border-strong bg-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-crimson">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink-primary">
                {selectedFile.name}
              </p>
              <p className="font-mono text-xs text-ink-secondary">
                {formatBytes(selectedFile.size)} · application/pdf
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setFileError(null);
                setClipboardNotice(null);
                onFileRemoved();
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-400" />
              Remove
            </Button>
          </div>
        </div>
      )}

      {fileError && (
        <AlertBanner
          variant="error"
          title="Invalid PDF file"
          description={fileError}
          onDismiss={() => setFileError(null)}
        />
      )}

      {clipboardNotice && (
        <AlertBanner
          variant="info"
          title="Clipboard Paste Notice"
          description={clipboardNotice}
          onDismiss={() => setClipboardNotice(null)}
        />
      )}
    </div>
  );
};
