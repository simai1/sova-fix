import { useEffect, useMemo, useRef, useState } from 'react';

import { showToast } from './toastBus';

import { MAX_UPLOAD_BYTES, formatBytesMB } from '@/utils/uploadLimits';

type Props = {
  onSubmit: (payload: { text: string; file?: File }) => Promise<void>;
  isSending: boolean;
  // По умолчанию textarea растёт вверх под длинный текст (контрактор/заказчик).
  // В админ-модалке высоту фиксируем размером кнопок — auto-grow не нужен.
  autoGrow?: boolean;
};

const MAX_ROWS = 4;
const LINE_HEIGHT_REM = 1.4;

// Размер вложения «по-человечески»: КБ для файлов меньше мегабайта, иначе МБ —
// так же, как размер показывается в самом сообщении чата.
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
};

// Статичные SVG-иконки вынесены из рендера: эти узлы не зависят от пропсов/стейта,
// держим один инстанс на модуль, чтобы React не пересоздавал их на каждый ре-рендер.
const attachIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.49" />
  </svg>
);

// Заглушка-превью для видео (mp4 не даёт картинку).
const videoThumbIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m22 8-6 4 6 4V8Z" />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </svg>
);

const removeIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

const ChatComposer = ({ onSubmit, isSending, autoGrow = true }: Props): JSX.Element => {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-grow textarea — высота = scrollHeight, но не больше MAX_ROWS строк.
  // Расчёт по line-height в rem гарантирует масштабирование вместе с шрифтом.
  useEffect(() => {
    if (!autoGrow) return;
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const rootFs = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const maxHeightPx = LINE_HEIGHT_REM * MAX_ROWS * rootFs + 24; /* + paddings */
    el.style.height = `${Math.min(el.scrollHeight, maxHeightPx)}px`;
  }, [text, autoGrow]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    await onSubmit({ text: trimmed, file: file ?? undefined });
    setText('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachClick = (): void => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0] ?? null;
    // Size-check ДО отправки: иначе nginx тенанта вернёт 413, multer —
    // LIMIT_FILE_SIZE без понятного текста, а юзер увидит generic-ошибку.
    if (f && f.size > MAX_UPLOAD_BYTES) {
      showToast(
        'error',
        `«${f.name}» больше ${formatBytesMB(MAX_UPLOAD_BYTES)}. Уменьшите файл и попробуйте снова.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setFile(f);
  };

  const handleClearFile = (): void => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ObjectURL для миниатюры выбранной картинки. Освобождаем при смене файла,
  // чтобы не утечка blob: ссылок при многократной отправке.
  const previewUrl = useMemo<string | null>(() => {
    if (!file || !file.type.startsWith('image/')) return null;
    return URL.createObjectURL(file);
  }, [file]);
  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  return (
    <form className="lk-chat__composer" onSubmit={handleSubmit}>
      {file ? (
        <div className="lk-chat__attach-preview">
          {previewUrl ? (
            <img className="lk-chat__attach-thumb" src={previewUrl} alt={`Превью ${file.name}`} />
          ) : (
            <span
              className="lk-chat__attach-thumb lk-chat__attach-thumb--placeholder"
              aria-hidden="true"
            >
              {videoThumbIcon}
            </span>
          )}
          <span className="lk-chat__attach-meta">
            <span className="lk-chat__attach-name">{file.name}</span>
            <span className="lk-chat__attach-size">{formatFileSize(file.size)}</span>
          </span>
          <button
            type="button"
            className="lk-chat__attach-remove"
            onClick={handleClearFile}
            aria-label="Убрать вложение"
          >
            {removeIcon}
          </button>
        </div>
      ) : null}

      <div className="lk-chat__composer-row">
        <button
          type="button"
          className="lk-chat__attach-btn"
          onClick={handleAttachClick}
          aria-label="Прикрепить фото"
          disabled={isSending}
        >
          {attachIcon}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/mp4"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          className="lk-textarea lk-chat__textarea"
          placeholder="Введите сообщение"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          aria-label="Сообщение"
          disabled={isSending}
        />
      </div>

      <button
        type="submit"
        className="lk-button lk-button--primary lk-chat__send-btn"
        disabled={isSending || text.trim().length === 0}
      >
        {isSending ? 'Отправка…' : 'Отправить'}
      </button>
    </form>
  );
};

export default ChatComposer;
