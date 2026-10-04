'use client';

import { useEffect, useRef, useState } from 'react';
import { Microphone, Stop, X } from '@phosphor-icons/react';
import { useI18n } from '@/lib/i18n/i18n-context';

// compact voice recorder — mic icon button that records via MediaRecorder
// and produces a File (voice-note.webm|m4a|ogg) for the parent to upload.
export function VoiceRecorderButton({
  onFile,
  fileName,
  onClear,
  label,
  maxMb = 20,
  className = '',
}: {
  onFile: (file: File) => void;
  fileName?: string | null;
  onClear?: () => void;
  label?: string;
  maxMb?: number;
  className?: string;
}) {
  const { t } = useI18n();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [errMsg, setErrMsg] = useState<string>();

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const discardRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    recorderRef.current = null;
  };
  // stop mic + timer on unmount
  useEffect(() => cleanup, []);

  const start = async () => {
    setErrMsg(undefined);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      setErrMsg(t('supportTickets.micError'));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4'].find((m) =>
        MediaRecorder.isTypeSupported(m),
      );
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      discardRef.current = false;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const discarded = discardRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        cleanup();
        if (discarded || blob.size === 0) return;
        if (blob.size > maxMb * 1024 * 1024) {
          setErrMsg(t('common.fileSizeError').replace('{max}', String(maxMb)));
          return;
        }
        const type = recorder.mimeType;
        const ext = type.includes('mp4') ? 'm4a' : type.includes('ogg') ? 'ogg' : 'webm';
        onFile(new File([blob], `voice-note.${ext}`, { type: blob.type }));
      };

      recorder.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setErrMsg(t('supportTickets.micError'));
      cleanup();
    }
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    setRecording(false);
  };

  const cancel = () => {
    discardRef.current = true;
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    else cleanup();
    setRecording(false);
  };

  const mm = Math.floor(seconds / 60);
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {recording ? (
        <>
          <button
            type="button"
            onClick={stop}
            aria-label={t('supportTickets.stopRecording')}
            className="inline-flex items-center gap-2 rounded-lg px-3 transition-colors"
            style={{
              height: 36,
              background: 'var(--danger-soft, rgba(180,60,50,.12))',
              color: 'var(--danger)',
              border: '1px solid var(--danger)',
            }}
          >
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, background: 'var(--danger)', animation: 'pulse 1s infinite' }}
            />
            <Stop size={16} weight="fill" />
          </button>
          <span className="text-[0.82rem] tabular-nums" dir="ltr" style={{ color: 'var(--danger)' }}>
            {mm}:{ss}
          </span>
          <button
            type="button"
            onClick={cancel}
            aria-label={t('common.cancel')}
            className="text-muted hover:text-danger transition-colors"
          >
            <X size={15} weight="bold" />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            title={label}
            aria-label={label}
            onClick={start}
            className="inline-flex items-center justify-center rounded-lg border transition-colors shrink-0"
            style={{
              width: 36,
              height: 36,
              borderColor: errMsg ? 'var(--danger)' : fileName ? 'var(--accent)' : 'var(--border)',
              color: errMsg ? 'var(--danger)' : fileName ? 'var(--accent)' : 'var(--muted)',
              background: fileName ? 'var(--warning-soft)' : 'transparent',
            }}
          >
            <Microphone size={18} weight={fileName ? 'fill' : 'regular'} />
          </button>
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
          {errMsg && <span className="text-[0.76rem] text-danger">{errMsg}</span>}
        </>
      )}
    </div>
  );
}
