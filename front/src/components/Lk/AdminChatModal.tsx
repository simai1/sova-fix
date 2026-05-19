import { useEffect, useState } from 'react';

import { subscribeAdminChat, closeAdminChat } from './adminChatBus';
import RequestChat from './RequestChat';

import { useGetMyRequestQuery } from '@/API/rtkQuery/lk.api';

import '@/styles/ui/index.scss';

const AdminChatModal = (): JSX.Element | null => {
  const [requestId, setRequestId] = useState<string | null>(null);

  useEffect(() => subscribeAdminChat(setRequestId), []);

  const { data: request } = useGetMyRequestQuery(requestId ?? '', { skip: !requestId });

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
      className="ui-modal__overlay ui-chat-modal__overlay"
      role="dialog"
      aria-modal="true"
      aria-label={request ? `Чат по заявке № ${request.number}` : 'Чат по заявке'}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeAdminChat();
      }}
    >
      <div className="ui-modal__sheet ui-chat-modal__sheet">
        <header className="ui-chat-modal__head">
          <div className="ui-chat-modal__head-text">
            <span className="ui-chat-modal__title">
              {request ? `Чат по заявке № ${request.number}` : 'Чат по заявке'}
            </span>
            {request?.Object?.name ? (
              <span className="ui-chat-modal__subtitle">{request.Object.name}</span>
            ) : null}
          </div>
          <button
            type="button"
            className="ui-chat-modal__close"
            aria-label="Закрыть"
            onClick={closeAdminChat}
          >
            ×
          </button>
        </header>
        <div className="ui-chat-modal__body">
          <RequestChat key={requestId} mode="admin" requestId={requestId} />
        </div>
      </div>
    </div>
  );
};

export default AdminChatModal;
