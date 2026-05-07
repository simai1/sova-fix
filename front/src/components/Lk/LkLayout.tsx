import { Navigate, Outlet } from 'react-router-dom';

import '../../styles/lk/index.scss';

import LkBottomNav from './LkBottomNav';
import LkPageHeader from './LkPageHeader';
import LkSidebar from './LkSidebar';
import LkSpinner from './LkSpinner';
import LkToastArea from './LkToastArea';

import { useGetMeQuery } from '@/API/rtkQuery/lk.api';
import { useLkWebSocket } from '@/hooks/useLkWebSocket';
import { getUserRole } from '@/utils/auth';

type Role = 'CONTRACTOR' | 'CUSTOMER';

type Props = {
  role: Role;
};

const LkLayout = ({ role }: Props): JSX.Element => {
  // Первичная проверка по sessionStorage — мгновенный редирект без сетевого запроса,
  // если в sessionStorage вообще нет userData или роль явно чужая.
  const sessionRole = getUserRole();
  const sessionRoleMismatch = sessionRole !== null && sessionRole !== role;

  // Авторитативная проверка: роль из /lk/me. Не доверяем sessionStorage,
  // потому что пользователь может подменить его в DevTools.
  const {
    data: me,
    isLoading,
    isError,
    error,
  } = useGetMeQuery(undefined, {
    skip: sessionRoleMismatch,
  });
  useLkWebSocket(me);

  if (sessionRoleMismatch) {
    return <Navigate to="/Authorization" replace />;
  }

  if (isLoading) {
    return <LkSpinner />;
  }

  // 401/403 от /lk/me — токен невалиден или роль не подходит, выкидываем на логин.
  if (isError) {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? (error as { status?: number }).status
        : undefined;
    if (status === 401 || status === 403) {
      return <Navigate to="/Authorization" replace />;
    }
    // Прочие ошибки (сеть/5xx) — тоже редиректим, чтобы не показывать LK не той роли.
    return <Navigate to="/Authorization" replace />;
  }

  if (!me || me.user.role !== role) {
    return <Navigate to="/Authorization" replace />;
  }

  return (
    <div className="lk-page">
      <LkPageHeader />
      <LkSidebar role={role} />
      <div className="lk-page__content">
        <Outlet />
      </div>
      <LkBottomNav role={role} />
      <LkToastArea />
    </div>
  );
};

export default LkLayout;
