type Props = {
  statusNumber: number | null | undefined;
  label?: string;
};

const STATUS_LABELS: Record<number, string> = {
  1: 'Новая',
  2: 'В работе',
  3: 'Выполнена',
  4: 'Неактуальна',
  5: 'Выезд без выполнения',
};

const StatusChip = ({ statusNumber, label }: Props): JSX.Element | null => {
  if (statusNumber == null) return null;
  const text = label ?? STATUS_LABELS[statusNumber] ?? `Статус ${statusNumber}`;
  return <span className={`lk-chip lk-chip--status-${statusNumber}`}>{text}</span>;
};

export default StatusChip;
