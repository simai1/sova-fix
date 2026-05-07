import { useEffect, useRef, useState } from 'react';

import { showToast } from './toastBus';

import { useInitTgBindingMutation } from '@/API/rtkQuery/lk.api';
import { getErrorMessage } from '@/utils/getErrorMessage';

type Props = {
  open: boolean;
  onClose: () => void;
};

// Форматируем оставшееся время как M:SS — в дизайне «Время ожидания: 4:32».
const formatRemaining = (msLeft: number): string => {
  const total = Math.max(0, Math.floor(msLeft / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const LinkTelegramModal = ({ open, onClose }: Props): JSX.Element | null => {
  const [initTg, initState] = useInitTgBindingMutation();
  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState<string | null>(null);
  const initOnceRef = useRef<boolean>(false);

  // При открытии модалки запрашиваем токен один раз. Повторный init
  // на бэкенде инвалидирует прошлый токен — это ок, но дёргать его без
  // нужды не хотим. initOnceRef сбрасывается при закрытии.
  useEffect(() => {
    if (!open) {
      initOnceRef.current = false;
      setDeepLink(null);
      setExpiresAt(null);
      setError(null);
      return;
    }
    if (initOnceRef.current) return;
    initOnceRef.current = true;
    (async (): Promise<void> => {
      try {
        const resp = await initTg().unwrap();
        setDeepLink(resp.deepLink);
        setExpiresAt(resp.expiresAt);
        setBotUsername(resp.botUsername ?? null);
      } catch (err) {
        const msg = getErrorMessage(err);
        setError(msg);
        showToast('error', msg);
      }
    })();
  }, [open, initTg]);

  // Тикаем countdown раз в секунду, пока модалка открыта.
  useEffect(() => {
    if (!open || !expiresAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open, expiresAt]);

  if (!open) return null;

  const expiresMs = expiresAt ? new Date(expiresAt).getTime() : 0;
  const msLeft = expiresMs - now;
  const expired = expiresAt !== null && msLeft <= 0;

  return (
    <div
      className="lk-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="lk-modal__sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lk-tg-link-title"
      >
        <h2 className="lk-modal__title" id="lk-tg-link-title">
          Привязка Telegram
        </h2>

        <div className="lk-link-tg">
          <p className="lk-profile__tg-hint">Чтобы получать уведомления о заявках в Telegram:</p>
          <ol className="lk-link-tg__steps">
            <li>Откройте Telegram</li>
            <li>Нажмите кнопку ниже — она приведёт в бота</li>
            <li>Внутри бота нажмите «Start»</li>
          </ol>

          {initState.isLoading ? (
            <div className="lk-spinner-wrap">
              <span className="lk-spinner" aria-label="Создание ссылки" />
            </div>
          ) : null}

          {error ? <div className="lk-link-tg__error">{error}</div> : null}

          {deepLink && !expired ? (
            <a
              href={deepLink}
              target="_blank"
              rel="noreferrer"
              className="lk-button lk-button--primary lk-button--block lk-link-tg__deeplink"
            >
              {botUsername ? `Открыть @${botUsername}` : 'Открыть бота'}
            </a>
          ) : null}

          {expiresAt && !expired ? (
            <div className="lk-link-tg__countdown">
              Ссылка действует ещё {formatRemaining(msLeft)}
            </div>
          ) : null}

          {expired ? (
            <>
              <div className="lk-link-tg__error">Срок действия ссылки истёк.</div>
              <button
                type="button"
                className="lk-button lk-button--ghost lk-button--block"
                onClick={async () => {
                  setError(null);
                  setExpiresAt(null);
                  setDeepLink(null);
                  try {
                    const resp = await initTg().unwrap();
                    setDeepLink(resp.deepLink);
                    setExpiresAt(resp.expiresAt);
                    setBotUsername(resp.botUsername ?? null);
                    setNow(Date.now());
                  } catch (err) {
                    const msg = getErrorMessage(err);
                    setError(msg);
                    showToast('error', msg);
                  }
                }}
              >
                Получить новую ссылку
              </button>
            </>
          ) : null}
        </div>

        <div className="lk-modal__actions">
          <button
            type="button"
            className="lk-button lk-button--ghost lk-button--block"
            onClick={onClose}
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkTelegramModal;
