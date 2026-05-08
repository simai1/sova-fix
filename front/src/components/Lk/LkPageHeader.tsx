import { useLocation, useNavigate } from 'react-router-dom';

import LkLogoMark from './LkLogoMark';

import { useLogout } from '@/hooks/useLogout';

type Props = {
  title?: string;
  showBack?: boolean;
};

const LkPageHeader = ({ title, showBack }: Props): JSX.Element => {
  const navigate = useNavigate();
  const location = useLocation();
  const logout = useLogout();

  const segments = location.pathname.split('/').filter(Boolean);
  // Корнем считаем /<role>/<section> — кнопку «назад» прячем, если не глубже
  const isRoot = segments.length <= 2;

  const inferredTitle = (() => {
    if (title) return title;
    const last = segments[segments.length - 1];
    if (!last) return 'Личный кабинет';
    if (last === 'requests') return 'Заявки';
    if (last === 'new') return 'Новая заявка';
    if (last === 'profile') return 'Профиль';
    if (last === 'chat') return 'Переписка';
    return 'Заявка';
  })();

  const handleLogout = (): void => {
    void logout();
  };

  const showBackBtn = !isRoot && (showBack ?? true);

  return (
    <header className="lk-page__header">
      {showBackBtn ? (
        <button
          type="button"
          className="lk-page__back"
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          ←
        </button>
      ) : (
        <LkLogoMark withWordmark />
      )}
      <h1 className="lk-page__title">{inferredTitle}</h1>
      <div className="lk-page__actions">
        <button
          type="button"
          className="lk-page__action-btn"
          onClick={handleLogout}
          aria-label="Выйти"
          title="Выйти"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default LkPageHeader;
