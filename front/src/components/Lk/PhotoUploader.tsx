import { useEffect, useRef, useState } from 'react';

import { showToast } from '@/components/Lk/toastBus';
import { MAX_UPLOAD_BYTES, formatBytesMB } from '@/utils/uploadLimits';

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png']);

type Props = {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  multiple?: boolean;
  accept?: string;
  hint?: string;
};

const PhotoUploader = ({
  files,
  onChange,
  maxFiles = 10,
  multiple = true,
  accept = 'image/jpeg,image/png',
  hint,
}: Props): JSX.Element => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const list = e.target.files;
    if (!list) return;
    const incoming = Array.from(list);
    const accepted: File[] = [];
    const rejectedFormat: string[] = [];
    const rejectedSize: string[] = [];
    for (const f of incoming) {
      if (!ALLOWED_MIMES.has(f.type)) {
        rejectedFormat.push(f.name);
        continue;
      }
      if (f.size > MAX_UPLOAD_BYTES) {
        rejectedSize.push(f.name);
        continue;
      }
      accepted.push(f);
    }
    if (rejectedFormat.length === 1) {
      showToast(
        'error',
        `«${rejectedFormat[0]}» не поддерживается. Загружайте только JPG/JPEG или PNG.`,
      );
    } else if (rejectedFormat.length > 1) {
      showToast(
        'error',
        `Пропущено ${rejectedFormat.length} файлов с неподдерживаемым форматом. Используйте JPG/JPEG или PNG.`,
      );
    }
    if (rejectedSize.length === 1) {
      showToast(
        'error',
        `«${rejectedSize[0]}» больше ${formatBytesMB(MAX_UPLOAD_BYTES)}. Уменьшите фото и попробуйте снова.`,
      );
    } else if (rejectedSize.length > 1) {
      showToast(
        'error',
        `Пропущено ${rejectedSize.length} файлов больше ${formatBytesMB(MAX_UPLOAD_BYTES)}. Уменьшите фото и попробуйте снова.`,
      );
    }
    const merged = multiple ? [...files, ...accepted] : accepted;
    const limited = merged.slice(0, maxFiles);
    onChange(limited);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (idx: number): void => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      {hint ? <div className="ui-field__hint">{hint}</div> : null}
      <div className="ui-photo-grid">
        {previews.map((url, idx) => (
          <div key={url} className="ui-photo-grid__item">
            <img src={url} alt={files[idx]?.name ?? ''} />
            <button
              type="button"
              className="ui-photo-grid__remove"
              onClick={() => removeAt(idx)}
              aria-label="Удалить"
            >
              ×
            </button>
          </div>
        ))}
        {files.length < maxFiles ? (
          <button
            type="button"
            className="ui-photo-grid__add"
            onClick={() => inputRef.current?.click()}
          >
            <span style={{ fontSize: 24 }}>+</span>
            <span>Добавить</span>
          </button>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          capture="environment"
          multiple={multiple}
          onChange={handlePick}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};

export default PhotoUploader;
