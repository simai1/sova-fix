import { useNavigate } from 'react-router-dom';

import { LogOut } from '@/API/API';
import { useAppDispatch } from '@/hooks/store';
import { SAVED_FILTERS_KEY_PREFIX } from '@/hooks/useSavedFilters';
import { transitionToLoggedOut } from '@/utils/authBoundary';

export const useLogout = (): (() => Promise<void>) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (): Promise<void> =>
    transitionToLoggedOut({
      dispatch,
      navigate,
      serverLogout: LogOut,
      sessionStorage: window.sessionStorage,
      localStorage: window.localStorage,
      savedFiltersKeyPrefix: SAVED_FILTERS_KEY_PREFIX,
    });
};
