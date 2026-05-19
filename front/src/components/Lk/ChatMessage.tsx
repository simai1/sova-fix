import { ChatMessage as ChatMessageType } from '@/API/rtkQuery/lk.api';
import { API_URL } from '@/constants/env.constant';

type Props = {
  message: ChatMessageType;
  isMine: boolean;
  onOpenPhoto?: (url: string) => void;
};

const buildFileUrl = (fileName: string | null | undefined): string | null => {
  if (!fileName) return null;
  if (fileName.startsWith('http://') || fileName.startsWith('https://')) return fileName;
  if (fileName.startsWith('/uploads/')) return `${API_URL}${fileName}`;
  return `${API_URL}/uploads/${fileName}`;
};

const isImageName = (name: string | null | undefined): boolean =>
  !!name && /\.(jpe?g|png|webp|gif)$/i.test(name);

const formatTime = (iso: string): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const roleConfig = (
  role: ChatMessageType['author']['roleName'] | null | undefined,
): { label: string; modifier: string } | null => {
  switch (role) {
    case 'MANAGER':
    case 'ADMIN':
      return { label: 'Менеджер', modifier: 'ui-chip--role-manager' };
    case 'CONTRACTOR':
      return { label: 'Исполнитель', modifier: 'ui-chip--role-contractor' };
    case 'CUSTOMER':
      return { label: 'Заказчик', modifier: 'ui-chip--role-customer' };
    default:
      return null;
  }
};

const ChatMessage = ({ message, isMine, onOpenPhoto }: Props): JSX.Element => {
  const role = roleConfig(message.author?.roleName);
  const rawName = message.attachment ?? message.fileName ?? null;
  const attachmentUrl = buildFileUrl(rawName);
  const isImage = isImageName(rawName);
  const authorName = message.author?.name ?? (isMine ? 'Вы' : 'Пользователь удалён');

  const cls = `ui-chat__msg ui-chat__msg--${isMine ? 'mine' : 'other'}`;

  return (
    <article className={cls} aria-label={`Сообщение от ${authorName}`}>
      <div className="ui-chat__msg-head">
        {!isMine ? <span className="ui-chat__msg-author">{authorName}</span> : null}
        {role ? <span className={`ui-chip ${role.modifier}`}>{role.label}</span> : null}
        <span className="ui-chat__msg-time">{formatTime(message.createdAt)}</span>
      </div>
      {message.text ? <div className="ui-chat__msg-text">{message.text}</div> : null}
      {attachmentUrl ? (
        <div className="ui-chat__msg-photos">
          {isImage && onOpenPhoto ? (
            <button
              type="button"
              className="ui-chat__photo"
              onClick={() => onOpenPhoto(attachmentUrl)}
              aria-label="Открыть фото"
            >
              <img src={attachmentUrl} alt="Вложение" />
            </button>
          ) : (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="ui-chat__photo"
              aria-label="Открыть вложение"
            >
              {isImage ? <img src={attachmentUrl} alt="Вложение" /> : <span>Вложение</span>}
            </a>
          )}
        </div>
      ) : null}
    </article>
  );
};

export default ChatMessage;
