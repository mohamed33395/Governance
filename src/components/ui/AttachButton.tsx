'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Microphone, Paperclip, X } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n/i18n-context';

// compact attachment picker — small icon button + hidden file input;
// shows the chosen file as a removable chip next to the button
export function AttachButton({
  accept,
  maxMb,
  onFile,
  icon = 'file',
  label,
  fileName,
  onClear,
  error,
  className = '',
}: {
  accept: string; // e.g. '.jpg,.png'
  maxMb: number;
  onFile: (file: File) => void;
  icon?: 'file' | 'image' | 'voice';
  label?: string; // tooltip + a11y label
  fileName?: string | null;
  onClear?: () => void;
  error?: string;
  className?: string;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string>();

  const Icon = icon === 'image' ? ImageIcon : icon === 'voice' ? Microphone : Paperclip;
  const shownError = error ?? localError;

  const handle = (file: File | undefined) => {
    if (!file) return;
    const allowed = accept.split(',').map((a) => a.trim().toLowerCase());
    const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!allowed.includes(ext)) {
      setLocalError(t('common.fileTypeError'));
      return;
    }
    if (file.size > maxMb * 1024 * 1024) {
      setLocalError(t('common.fileSizeError').replace('{max}', String(maxMb)));
      return;
    }
    setLocalError(undefined);
    onFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        title={label}
        aria-label={label}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center rounded-lg border transition-colors shrink-0"
        style={{
          width: 36,
          height: 36,
          borderColor: shownError ? 'var(--danger)' : fileName ? 'var(--accent)' : 'var(--border)',
          color: shownError ? 'var(--danger)' : fileName ? 'var(--accent)' : 'var(--muted)',
          background: fileName ? 'var(--warning-soft)' : 'transparent',
        }}
      >
        <Icon size={18} weight={fileName ? 'fill' : 'regular'} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handle(e.target.files?.[0])}
      />

      {fileName ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[0.78rem]"
          style={{ background: 'var(--cream)', border: '1px solid var(--border)' }}
        >
          <span className="max-w-[140px] truncate" dir="ltr">
            {fileName}
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label={t('common.delete')}
              className="text-muted hover:text-danger transition-colors"
            >
              <X size={13} weight="bold" />
            </button>
          )}
        </span>
      ) : (
        label && <span className="text-[0.78rem] text-muted">{label}</span>
      )}

      {shownError && <span className="text-[0.76rem] text-danger">{shownError}</span>}
    </div>
  );
}
