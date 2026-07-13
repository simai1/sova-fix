import { useNavigate } from 'react-router-dom';

import { LogOut } from '@/API/API';
import { lkApi } from '@/API/rtkQuery/lk.api';
import { lkPushApi } from '@/API/rtkQuery/lkPush.api';
import { repairRequestsApi } from '@/API/rtkQuery/requests.api';
import { useAppDispatch } from '@/hooks/store';
import { SAVED_FILTERS_KEY_PREFIX } from '@/hooks/useSavedFilters';
import { clearUserData } from '@/utils/auth';

const clearLkSavedFilters = (): void => {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(SAVED_FILTERS_KEY_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {}
};

export const useLogout = (): (() => Promise<void>) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return async (): Promise<void> => {
    try {
      await LogOut();
    } catch {}
    clearUserData();
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    clearLkSavedFilters();
    dispatch(lkApi.util.resetApiState());
    dispatch(lkPushApi.util.resetApiState());
    dispatch(repairRequestsApi.util.resetApiState());
    navigate('/Authorization', { replace: true });
  };
};
