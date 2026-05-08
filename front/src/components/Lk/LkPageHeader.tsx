import { useLocation, useNavigate } from 'react-router-dom';

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

  return (
    <header className="lk-page__header">
      {!isRoot && (showBack ?? true) ? (
        <button
          type="button"
          className="lk-page__back"
          onClick={() => navigate(-1)}
          aria-label="Назад"
        >
          ←
        </button>
      ) : (
        <span style={{ width: 32 }} />
      )}
      <h1 className="lk-page__title">{inferredTitle}</h1>
      <button type="button" className="lk-page__logout" onClick={handleLogout}>
        Выход
      </button>
    </header>
  );
};

export default LkPageHeader;
