import { useNavigate } from 'react-router-dom';

import { useGetMeQuery, useGetMyObjectsQuery } from '@/API/rtkQuery/lk.api';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkSpinner from '@/components/Lk/LkSpinner';
import { clearUserData } from '@/utils/auth';

const roleLabel = (role: string | undefined): string => {
  switch (role) {
    case 'CONTRACTOR':
      return 'Исполнитель';
    case 'CUSTOMER':
      return 'Заказчик';
    case 'ADMIN':
      return 'Администратор';
    default:
      return role ?? '—';
  }
};

const ContractorProfile = (): JSX.Element => {
  const navigate = useNavigate();
  const { data: me, isLoading, isError } = useGetMeQuery();
  const { data: myObjects = [] } = useGetMyObjectsQuery();

  if (isLoading) return <LkSpinner />;
  if (isError || !me) return <LkEmpty text="Не удалось загрузить профиль" />;

  const handleLogout = (): void => {
    clearUserData();
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    navigate('/Authorization', { replace: true });
  };

  return (
    <>
      <div className="lk-card">
        <div className="lk-row">
          <div className="lk-col-12 lk-col-md-6">
            <div className="lk-field__label">Имя</div>
            <div>{me.user.name ?? '—'}</div>
          </div>
          <div className="lk-col-12 lk-col-md-6">
            <div className="lk-field__label">Email / логин</div>
            <div>{me.user.login}</div>
          </div>
        </div>
        <div className="lk-field__label">Роль</div>
        <div>{roleLabel(me.user.role)}</div>
      </div>

      <div className="lk-card">
        <h2 className="lk-card__title">Мои объекты</h2>
        {myObjects.length === 0 ? (
          <div className="lk-card__muted">Нет назначенных объектов</div>
        ) : (
          myObjects.map((o) => (
            <div key={o.id} className="lk-card__row">
              <span>{o.name}</span>
              {o.unit?.name ? <span className="lk-card__muted">{o.unit.name}</span> : null}
            </div>
          ))
        )}
      </div>

      <button
        type="button"
        className="lk-button lk-button--ghost lk-button--block"
        onClick={handleLogout}
      >
        Выйти
      </button>
    </>
  );
};

export default ContractorProfile;
