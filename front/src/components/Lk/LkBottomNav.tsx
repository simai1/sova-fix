import { NavLink, useLocation } from 'react-router-dom';

type Role = 'CONTRACTOR' | 'CUSTOMER';

type IconKind = 'list' | 'plus' | 'profile';

type NavItem = {
  label: string;
  icon: IconKind;
  to: string;
};

const ITEMS_CONTRACTOR: NavItem[] = [
  { label: 'Заявки', icon: 'list', to: '/contractor/requests' },
  { label: 'Профиль', icon: 'profile', to: '/contractor/profile' },
];

const ITEMS_CUSTOMER: NavItem[] = [
  { label: 'Заявки', icon: 'list', to: '/customer/requests' },
  { label: 'Создать', icon: 'plus', to: '/customer/requests/new' },
  { label: 'Профиль', icon: 'profile', to: '/customer/profile' },
];

const ICON_PROPS = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'lk-bottom-nav__icon',
};

// Иконки статичны (ни один проп на них не влияет) — создаём SVG-деревья
// один раз на уровне модуля, чтобы не пересоздавать их на каждой навигации.
const ICONS: Record<IconKind, JSX.Element> = {
  list: (
    <svg {...ICON_PROPS}>
      <line x1="8" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="20" y2="12" />
      <line x1="8" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" />
      <circle cx="4" cy="12" r="1" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  ),
  plus: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  profile: (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
};

type Props = {
  role: Role;
};

// Путь to является сегментным префиксом pathname (или равен ему).
const isUnder = (pathname: string, to: string): boolean =>
  pathname === to || pathname.startsWith(`${to}/`);

const LkBottomNav = ({ role }: Props): JSX.Element => {
  const items = role === 'CONTRACTOR' ? ITEMS_CONTRACTOR : ITEMS_CUSTOMER;
  const { pathname } = useLocation();

  // Подсвечиваем пункт с самым длинным совпавшим префиксом: иначе «Заявки»
  // (/customer/requests) горит вместе с «Создать» (/customer/requests/new),
  // потому что первый путь — префикс второго.
  const matched = items.map((item) => item.to).filter((to) => isUnder(pathname, to));
  const activeTo = matched.length
    ? matched.reduce((best, to) => (to.length > best.length ? to : best))
    : null;

  return (
    <nav className="lk-bottom-nav" aria-label="Навигация">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`lk-bottom-nav__item${
            item.to === activeTo ? ' lk-bottom-nav__item--active' : ''
          }`}
        >
          {ICONS[item.icon]}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default LkBottomNav;
