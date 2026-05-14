import { useEffect, useRef, useState } from 'react';

import { showToast } from '@/components/Lk/toastBus';
import { MAX_UPLOAD_BYTES, formatBytesMB } from '@/utils/uploadLimits';

// Зеркалит whitelist multer'а в `api/src/routes/lk.route.ts::imageOnlyFilter`.
// Если backend начнёт принимать что-то ещё (webp/heic) — расширить здесь.
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

  // Создаём object-URL'ы для превью; чистим при размонтировании / смене files
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
    // accept-атрибут на input не гарантирует фильтр (через «Все файлы»
    // и DnD пользователь может прислать webp/heic/avif), поэтому отбрасываем
    // на JS — иначе backend вернёт 400, а юзер увидит generic-тост.
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
    // Size-check ловим ДО отправки: иначе nginx тенанта вернёт 413, а multer —
    // LIMIT_FILE_SIZE без понятного текста, и фронт покажет generic-ошибку.
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
    // Сброс input — иначе повторный выбор того же файла не вызовет change
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (idx: number): void => {
    const next = files.filter((_, i) => i !== idx);
    onChange(next);
  };

  return (
    <div>
      {hint ? <div className="lk-field__hint">{hint}</div> : null}
      <div className="lk-photo-grid">
        {previews.map((url, idx) => (
          <div key={url} className="lk-photo-grid__item">
            <img src={url} alt={files[idx]?.name ?? ''} />
            <button
              type="button"
              className="lk-photo-grid__remove"
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
            className="lk-photo-grid__add"
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
