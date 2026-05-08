import { NavLink } from 'react-router-dom';

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

const SidebarIcon = ({ kind }: { kind: IconKind }): JSX.Element => {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    className: 'lk-sidebar__icon',
  };
  if (kind === 'list') {
    return (
      <svg {...common}>
        <line x1="8" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="20" y2="12" />
        <line x1="8" y1="18" x2="20" y2="18" />
        <circle cx="4" cy="6" r="1" />
        <circle cx="4" cy="12" r="1" />
        <circle cx="4" cy="18" r="1" />
      </svg>
    );
  }
  if (kind === 'plus') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
};

type Props = {
  role: Role;
};

const LkSidebar = ({ role }: Props): JSX.Element => {
  const items = role === 'CONTRACTOR' ? ITEMS_CONTRACTOR : ITEMS_CUSTOMER;
  return (
    <aside className="lk-sidebar" aria-label="Боковая навигация">
      <div className="lk-sidebar__group-label">Меню</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to.endsWith('/new') ? true : false}
          className={({ isActive }) =>
            `lk-sidebar__item${isActive ? ' lk-sidebar__item--active' : ''}`
          }
        >
          <SidebarIcon kind={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
};

export default LkSidebar;
