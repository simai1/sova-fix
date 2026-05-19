import { ChatMessage } from '@/API/rtkQuery/lk.api';

type Props = {
  messages: ChatMessage[];
  legacyComment?: string | null;
  onOpenChat: () => void;
};

const formatTime = (iso: string): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const roleLabel = (role: ChatMessage['author']['roleName']): string => {
  switch (role) {
    case 'MANAGER':
    case 'ADMIN':
      return 'Менеджер';
    case 'CONTRACTOR':
      return 'Исполнитель';
    case 'CUSTOMER':
      return 'Заказчик';
    default:
      return '';
  }
};

const CommentPreview = ({ messages, legacyComment, onOpenChat }: Props): JSX.Element => {
  const last = messages.length > 0 ? messages[messages.length - 1] : null;
  const totalShown = messages.length;

  if (!last && legacyComment) {
    return (
      <div className="lk-comment-preview">
        <div className="lk-comment-preview__head">
          <span className="lk-comment-preview__author">Сообщение администратора</span>
        </div>
        <div className="lk-comment-preview__text">{legacyComment}</div>
        <button
          type="button"
          className="lk-button lk-button--ghost lk-button--block"
          onClick={onOpenChat}
        >
          Открыть переписку
        </button>
      </div>
    );
  }

  if (!last) {
    return (
      <div className="lk-comment-preview">
        <div className="lk-comment-preview__empty">Сообщений пока нет</div>
        <button
          type="button"
          className="lk-button lk-button--primary lk-button--block"
          onClick={onOpenChat}
        >
          Написать сообщение
        </button>
      </div>
    );
  }

  const author = last.author?.name ?? roleLabel(last.author?.roleName ?? 'OTHER') ?? '—';
  const role = roleLabel(last.author?.roleName ?? 'OTHER');

  return (
    <div className="lk-comment-preview">
      <div className="lk-comment-preview__head">
        <span className="lk-comment-preview__author">{author}</span>
        {role && role !== author ? <span className="lk-comment-preview__role">{role}</span> : null}
        <span className="lk-comment-preview__time">{formatTime(last.createdAt)}</span>
      </div>
      <div className="lk-comment-preview__text">{last.text}</div>
      <button
        type="button"
        className="lk-button lk-button--ghost lk-button--block"
        onClick={onOpenChat}
      >
        Открыть переписку{totalShown > 0 ? ` (${totalShown})` : ''}
      </button>
    </div>
  );
};

export default CommentPreview;
