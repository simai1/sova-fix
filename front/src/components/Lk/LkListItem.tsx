import { Link } from 'react-router-dom';
import type { CSSProperties } from 'react';

import StatusChip from './StatusChip';
import UrgencyChip from './UrgencyChip';

import { RequestDto } from '@/API/rtkQuery/lk.api';

type Props = {
  request: RequestDto;
  to: string;
  // Индекс в первой странице — для stagger-fade-in анимации (см. _components.scss
  // § lk-list-item: `animation-delay: calc(var(--lk-i, 0) * 30ms)`). При догрузке
  // следующих страниц index не передаётся — fallback 0, анимация без задержки
  // или вовсе не воспроизводится повторно (browser-rendered animation один раз).
  index?: number;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
};

const getStatusNumber = (req: RequestDto): number | null => {
  if (typeof req.status === 'number') return req.status;
  if (req.status && typeof req.status === 'object') return req.status.number ?? null;
  return req.Status?.number ?? null;
};

const getUrgencyObj = (req: RequestDto) => {
  if (req.Urgency) return req.Urgency;
  if (req.urgency && typeof req.urgency === 'object') return req.urgency;
  return null;
};

const getUrgencyName = (req: RequestDto): string | null => {
  if (typeof req.urgency === 'string') return req.urgency;
  return req.Urgency?.name ?? null;
};

const LkListItem = ({ request, to, index }: Props): JSX.Element => {
  const statusNumber = getStatusNumber(request);
  const objectName = request.Object?.name ?? '—';
  const desc = request.problemDescription
    ? request.problemDescription.length > 140
      ? `${request.problemDescription.slice(0, 140)}…`
      : request.problemDescription
    : null;
  const style = index !== undefined ? ({ '--lk-i': index } as CSSProperties) : undefined;

  return (
    <Link to={to} className="lk-list-item" style={style}>
      <div className="lk-list-item__top">
        <span className="lk-list-item__number">№ {request.number}</span>
        <StatusChip statusNumber={statusNumber} />
        {/* Чип «Закреплена за мной» — даёт исполнителю быстро отделить
            свои назначенные заявки от тех, что видны через UserObject. */}
        {request.isAssigned ? (
          <span className="lk-chip lk-chip--accent" aria-label="Заявка закреплена за вами">
            Моя
          </span>
        ) : null}
      </div>
      <div className="lk-list-item__title">{objectName}</div>
      {desc ? <div className="lk-list-item__desc">{desc}</div> : null}
      <div className="lk-list-item__bottom">
        <UrgencyChip urgency={getUrgencyObj(request)} fallbackName={getUrgencyName(request)} />
        <span className="lk-list-item__date">{formatDate(request.createdAt)}</span>
      </div>
    </Link>
  );
};

export default LkListItem;
