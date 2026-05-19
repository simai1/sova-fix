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
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  className: 'ui-sidebar__icon',
};

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

const isUnder = (pathname: string, to: string): boolean =>
  pathname === to || pathname.startsWith(`${to}/`);

const LkSidebar = ({ role }: Props): JSX.Element => {
  const items = role === 'CONTRACTOR' ? ITEMS_CONTRACTOR : ITEMS_CUSTOMER;
  const { pathname } = useLocation();

  const matched = items.map((item) => item.to).filter((to) => isUnder(pathname, to));
  const activeTo = matched.length
    ? matched.reduce((best, to) => (to.length > best.length ? to : best))
    : null;

  return (
    <aside className="ui-sidebar" aria-label="Боковая навигация">
      <div className="ui-sidebar__group-label">Меню</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={`ui-sidebar__item${item.to === activeTo ? ' ui-sidebar__item--active' : ''}`}
        >
          {ICONS[item.icon]}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default LkSidebar;
