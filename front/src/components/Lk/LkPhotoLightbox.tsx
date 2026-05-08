import { useCallback, useEffect } from 'react';

type Props = {
  photos: string[];
  index: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
};

const LkPhotoLightbox = ({ photos, index, onClose, onNavigate }: Props): JSX.Element | null => {
  const total = photos.length;
  const safeIndex = Math.min(Math.max(index, 0), total - 1);
  const url = photos[safeIndex];

  const goPrev = useCallback(() => {
    if (total < 2) return;
    onNavigate((safeIndex - 1 + total) % total);
  }, [onNavigate, safeIndex, total]);

  const goNext = useCallback(() => {
    if (total < 2) return;
    onNavigate((safeIndex + 1) % total);
  }, [onNavigate, safeIndex, total]);

  // Esc/←/→ — глобальные клавиши, пока модалка открыта.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  // Блокируем скролл фона на время предпросмотра.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (total === 0 || !url) return null;

  return (
    <div
      className="lk-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Просмотр фото"
      onClick={onClose}
    >
      <button
        type="button"
        className="lk-lightbox__close"
        aria-label="Закрыть"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>

      {total > 1 ? (
        <button
          type="button"
          className="lk-lightbox__nav lk-lightbox__nav--prev"
          aria-label="Предыдущее фото"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
        >
          ‹
        </button>
      ) : null}

      <img
        className="lk-lightbox__image"
        src={url}
        alt={`Фото ${safeIndex + 1} из ${total}`}
        onClick={(e) => e.stopPropagation()}
      />

      {total > 1 ? (
        <button
          type="button"
          className="lk-lightbox__nav lk-lightbox__nav--next"
          aria-label="Следующее фото"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
        >
          ›
        </button>
      ) : null}

      {total > 1 ? (
        <div className="lk-lightbox__counter" aria-live="polite">
          {safeIndex + 1} / {total}
        </div>
      ) : null}
    </div>
  );
};

export default LkPhotoLightbox;
