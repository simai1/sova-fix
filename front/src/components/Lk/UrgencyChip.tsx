import UrgencyPill from './UrgencyPill';

type UrgencyLike = {
  name?: string | null;
  color?: string | null;
} | null;

type Props = {
  urgency?: UrgencyLike;
  fallbackName?: string | null;
};

/**
 * Чип срочности заявки для карточек и списков.
 *
 * @remarks
 * Тонкая обёртка над {@link UrgencyPill}: достаёт название и цвет из объекта
 * срочности справочника. Палитра — та же, что в селекторах создания,
 * редактирования и фильтрации заявок.
 */
const UrgencyChip = ({ urgency, fallbackName }: Props): JSX.Element | null => {
  if (!urgency && !fallbackName) return null;

  return <UrgencyPill label={urgency?.name ?? fallbackName ?? '—'} color={urgency?.color} />;
};

export default UrgencyChip;
