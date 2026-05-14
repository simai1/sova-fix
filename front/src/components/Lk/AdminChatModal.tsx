import { useEffect, useState } from 'react';

import { subscribeAdminChat, closeAdminChat } from './adminChatBus';
import RequestChat from './RequestChat';

import { useGetMyRequestQuery } from '@/API/rtkQuery/lk.api';

// LK-стили подгружаются в основном через LkLayout (ЛК Исполнителя/Заказчика).
// В админ-стеке этого Layout нет, поэтому подгружаем LK-токены и lk-chat/lk-modal
// здесь — иначе .lk-table-chat-btn, .lk-chat-modal__*, .lk-chat--embedded
// не попадут в bundle при заходе сразу на админ-главную.
import '@/styles/lk/index.scss';

// Модалка чата заявки для веб-ЛК Менеджера. Слушает adminChatBus,
// рендерится в HomePageAdmin (см. там). По Esc и клику на overlay — закрытие.
const AdminChatModal = (): JSX.Element | null => {
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => subscribeAdminChat(setRequestId), []);

  // Шапка модалки — № заявки и объект. Грузим то же, что показывает чат, чтобы
  // не зависеть от того, что лежит в legacy-row админ-таблицы.
  const { data: request } = useGetMyRequestQuery(requestId ?? '', { skip: !requestId });

  // Esc и блокировка скролла страницы пока модалка открыта.
  useEffect(() => {
    if (!requestId) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') closeAdminChat();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [requestId]);

  if (!requestId) return null;

  return (
    <div
      className="lk-modal__overlay lk-chat-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label={request ? `Чат по заявке № ${request.number}` : 'Чат по заявке'}
      onMouseDown={(e) => {
        // Закрываем только если клик начался на самом overlay'е (не внутри окна).
        if (e.target === e.currentTarget) closeAdminChat();
      }}
    >
      <div className="lk-modal__sheet lk-chat-modal__sheet">
        <header className="lk-chat-modal__head">
          <div className="lk-chat-modal__head-text">
            <span className="lk-chat-modal__title">
              {request ? `Чат по заявке № ${request.number}` : 'Чат по заявке'}
            </span>
            {request?.Object?.name ? (
              <span className="lk-chat-modal__subtitle">{request.Object.name}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="lk-chat-modal__close"
            aria-label="Закрыть"
            onClick={closeAdminChat}
          >
            ×
          </button>
        </header>
        <div className="lk-chat-modal__body">
          {/* key={requestId} — перемонтируем чат при смене заявки, чтобы сбросить
              внутренний cursor/accumulated state RequestChat. */}
          <RequestChat key={requestId} mode="admin" requestId={requestId} />
        </div>
      </div>
    </div>
  );
};

export default AdminChatModal;
