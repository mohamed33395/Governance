'use client';

import { useRef, useState, type DragEvent } from 'react';
import { useI18n } from '@/lib/i18n/i18n-context';

// drag & drop + click; client-side size/mime check before upload
export function FileDrop({
  accept,
  maxMb,
  onFile,
  error,
  label,
  className = '',
}: {
  accept: string;         // e.g. '.pdf,.doc,.docx'
  maxMb: number;
  onFile: (file: File) => void;
  error?: string;
  label?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState<string>();
  const [fileName, setFileName] = useState<string>();

  const validate = (file: File): boolean => {
    const allowed = accept.split(',').map((a) => a.trim().toLowerCase());
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowed.includes(ext)) {
      setLocalError(t('common.fileTypeError'));
      return false;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setLocalError(t('common.fileSizeError').replace('{max}', String(maxMb)));
      return false;
    }
    setLocalError(undefined);
    return true;
  };

  const handle = (file: File | undefined) => {
    if (!file) return;
    if (!validate(file)) return;
    setFileName(file.name);
    onFile(file);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handle(e.dataTransfer.files?.[0]);
  };

  const shownError = error ?? localError;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-8 text-center cursor-pointer transition-colors"
        style={{
          borderColor: shownError ? 'var(--danger)' : dragOver ? 'var(--accent)' : 'var(--border)',
          background: dragOver ? 'var(--warning-soft)' : 'var(--background)',
        }}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" className="text-muted">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="m17 8-5-5-5 5" />
          <path d="M12 3v12" />
        </svg>
        <span className="text-[0.88rem] text-text font-medium">
          {fileName ?? label ?? t('common.fileDrop')}
        </span>
        <span className="text-[0.76rem] text-muted">
          {accept} · {t('common.maxMb').replace('{max}', String(maxMb))}
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />
      {shownError && <p className="text-[0.78rem] text-danger mt-1.5">{shownError}</p>}
    </div>
  );
}
