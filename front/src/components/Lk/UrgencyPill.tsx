import { CSSProperties } from 'react';

import { getReadableTextColor } from '@/utils/contrastColor';

type Props = {
  label: string;
  color?: string | null;
  className?: string;
  style?: CSSProperties;
};

/**
 * Чип срочности — единое визуальное представление срочности во всех местах
 * приложения: селекты создания и редактирования заявки, фильтры, карточки.
 *
 * @remarks
 * Фон — произвольный hex из справочника срочностей (`urgency.color`), цвет
 * текста подбирается по яркости фона ({@link getReadableTextColor}). За счёт
 * этого палитра срочности едина: один и тот же чип рендерится везде. Если
 * цвет не задан — нейтральный fallback из класса `.ui-chip--urgency`.
 */
const UrgencyPill = ({ label, color, className, style }: Props): JSX.Element => {
  const cls = ['ui-chip', 'ui-chip--urgency', className].filter(Boolean).join(' ');

  return (
    <span
      className={cls}
      style={
        color ? { backgroundColor: color, color: getReadableTextColor(color), ...style } : style
      }
    >
      {label}
    </span>
  );
};

export default UrgencyPill;
