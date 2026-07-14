import { ChatMessage } from '@/API/rtkQuery/lk.api';
import { ROLE_LABELS_BY_NAME } from '@/constants/roles.constant';

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
    case 'ADMIN':
      return ROLE_LABELS_BY_NAME.ADMIN;
    case 'MANAGER':
      return ROLE_LABELS_BY_NAME.MANAGER;
    case 'CONTRACTOR':
      return ROLE_LABELS_BY_NAME.CONTRACTOR;
    case 'CUSTOMER':
      return ROLE_LABELS_BY_NAME.CUSTOMER;
    default:
      return '';
  }
};

const CommentPreview = ({ messages, legacyComment, onOpenChat }: Props): JSX.Element => {
  const last = messages.length > 0 ? messages[messages.length - 1] : null;
  const totalShown = messages.length;

  if (!last && legacyComment) {
    return (
      <div className="ui-comment-preview">
        <div className="ui-comment-preview__head">
          <span className="ui-comment-preview__author">Сообщение администратора</span>
        </div>
        <div className="ui-comment-preview__text">{legacyComment}</div>
        <button
          type="button"
          className="ui-button ui-button--ghost ui-button--block"
          onClick={onOpenChat}
        >
          Открыть переписку
        </button>
      </div>
    );
  }

  if (!last) {
    return (
      <div className="ui-comment-preview">
        <div className="ui-comment-preview__empty">Сообщений пока нет</div>
        <button
          type="button"
          className="ui-button ui-button--primary ui-button--block"
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
    <div className="ui-comment-preview">
      <div className="ui-comment-preview__head">
        <span className="ui-comment-preview__author">{author}</span>
        {role && role !== author ? <span className="ui-comment-preview__role">{role}</span> : null}
        <span className="ui-comment-preview__time">{formatTime(last.createdAt)}</span>
      </div>
      <div className="ui-comment-preview__text">{last.text}</div>
      <button
        type="button"
        className="ui-button ui-button--ghost ui-button--block"
        onClick={onOpenChat}
      >
        Открыть переписку{totalShown > 0 ? ` (${totalShown})` : ''}
      </button>
    </div>
  );
};

export default CommentPreview;
