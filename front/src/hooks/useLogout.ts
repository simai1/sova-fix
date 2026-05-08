import { useNavigate } from 'react-router-dom';

import { LogOut } from '@/API/API';
import { lkApi } from '@/API/rtkQuery/lk.api';
import { lkPushApi } from '@/API/rtkQuery/lkPush.api';
import { useAppDispatch } from '@/hooks/store';
import { clearUserData } from '@/utils/auth';

// Единая точка выхода из ЛК. Покрывает три инварианта, которые легко
// потерять при дублировании logout-логики по компонентам:
//   1) Бэкенд-сторона: POST /auth/logout удаляет refreshToken из БД и чистит
//      HttpOnly-cookie. Без этого украденный refreshToken остаётся валидным.
//   2) Sessionstorage: accessToken / refreshToken / userData.
//   3) RTK Query кеши user-scoped api (lkApi, lkPushApi). Без сброса
//      повторный login под другую роль/юзера получает закешированный me
//      от прошлой сессии, LkLayout видит mismatch роли и кикает обратно
//      на /Authorization (см. components/Lk/LkLayout.tsx::useGetMeQuery).
export const useLogout = (): (() => Promise<void>) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return async (): Promise<void> => {
    try {
      await LogOut();
    } catch {
      // best-effort: даже если сервер недоступен, локально вычищаем всё ниже
    }
    clearUserData();
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    dispatch(lkApi.util.resetApiState());
    dispatch(lkPushApi.util.resetApiState());
    navigate('/Authorization', { replace: true });
  };
};
