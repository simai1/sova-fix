import { Link } from 'react-router-dom';

import StatusChip from './StatusChip';
import UrgencyChip from './UrgencyChip';

import { RequestDto } from '@/API/rtkQuery/lk.api';

type Props = {
  request: RequestDto;
  to: string;
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

const LkListItem = ({ request, to }: Props): JSX.Element => {
  const statusNumber = getStatusNumber(request);
  const objectName = request.Object?.name ?? '—';

  return (
    <Link to={to} className="lk-list-item">
      <div className="lk-list-item__top">
        <span className="lk-list-item__number">№ {request.number}</span>
        <StatusChip statusNumber={statusNumber} />
      </div>
      <div className="lk-list-item__title">{objectName}</div>
      {request.problemDescription ? (
        <div className="lk-card__muted">
          {request.problemDescription.length > 140
            ? `${request.problemDescription.slice(0, 140)}…`
            : request.problemDescription}
        </div>
      ) : null}
      <div className="lk-list-item__chips">
        <UrgencyChip urgency={getUrgencyObj(request)} fallbackName={getUrgencyName(request)} />
      </div>
      <div className="lk-list-item__date">{formatDate(request.createdAt)}</div>
    </Link>
  );
};

export default LkListItem;
