const DARK_TEXT = 'var(--color-text)';
const LIGHT_TEXT = '#ffffff';

/**
 * Подбирает читаемый цвет текста (тёмный или белый) для произвольного фона.
 *
 * @remarks
 * Цвет срочности задаётся менеджером в справочнике как произвольный hex,
 * поэтому текст на чипе подбирается по относительной яркости фона
 * (WCAG-формула линеаризации каналов). Так чип срочности остаётся читаемым
 * на любом цвете — это и обеспечивает единую палитру во всех селекторах.
 *
 * @param hex - Цвет фона в формате `#rgb` или `#rrggbb`
 * @returns CSS-значение цвета текста — тёмное для светлых фонов, белое для тёмных
 */
export const getReadableTextColor = (hex?: string | null): string => {
  if (!hex) return DARK_TEXT;

  const raw = hex.trim().replace(/^#/, '');
  const full =
    raw.length === 3
      ? raw
          .split('')
          .map((c) => c + c)
          .join('')
      : raw;

  if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return DARK_TEXT;

  const toLinear = (channelHex: string): number => {
    const channel = parseInt(channelHex, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };

  const luminance =
    0.2126 * toLinear(full.slice(0, 2)) +
    0.7152 * toLinear(full.slice(2, 4)) +
    0.0722 * toLinear(full.slice(4, 6));

  return luminance > 0.6 ? DARK_TEXT : LIGHT_TEXT;
};
