type UrgencyLike = {
  name?: string | null;
  number?: number | null;
  color?: string | null;
} | null;

type Props = {
  urgency?: UrgencyLike;
  fallbackName?: string | null;
};

const classifyByNumber = (n: number): 'low' | 'mid' | 'high' => {
  if (n <= 1) return 'low';
  if (n === 2) return 'mid';
  return 'high';
};

const classifyByColor = (color: string): 'low' | 'mid' | 'high' | null => {
  const c = color.toLowerCase();
  if (c.includes('red') || c.includes('#c0392b') || c.includes('high')) return 'high';
  if (c.includes('yellow') || c.includes('#f5c518') || c.includes('mid')) return 'mid';
  if (c.includes('green') || c.includes('low') || c.includes('sand')) return 'low';
  return null;
};

const UrgencyChip = ({ urgency, fallbackName }: Props): JSX.Element | null => {
  if (!urgency && !fallbackName) return null;

  let cls: 'low' | 'mid' | 'high' = 'low';
  if (urgency?.color) {
    const byColor = classifyByColor(urgency.color);
    if (byColor) cls = byColor;
  } else if (typeof urgency?.number === 'number') {
    cls = classifyByNumber(urgency.number);
  }

  const text = urgency?.name ?? fallbackName ?? '—';
  return <span className={`lk-chip lk-chip--urgency-${cls}`}>{text}</span>;
};

export default UrgencyChip;
