import { lkApi } from '@/API/rtkQuery/lk.api';
import { lkPushApi } from '@/API/rtkQuery/lkPush.api';
import { repairRequestsApi } from '@/API/rtkQuery/requests.api';

type ActorScopedResetAction =
  | ReturnType<typeof lkApi.util.resetApiState>
  | ReturnType<typeof lkPushApi.util.resetApiState>
  | ReturnType<typeof repairRequestsApi.util.resetApiState>;

type ActorBoundaryDispatch = (action: ActorScopedResetAction) => unknown;

type LoginBoundaryDependencies = {
  status?: number;
  dispatch: ActorBoundaryDispatch;
};

type LogoutBoundaryDependencies = {
  dispatch: ActorBoundaryDispatch;
  navigate: (path: string, options: { replace: boolean }) => unknown;
  serverLogout: () => Promise<unknown>;
  sessionStorage: Pick<Storage, 'removeItem'>;
  localStorage: Pick<Storage, 'key' | 'length' | 'removeItem'>;
  savedFiltersKeyPrefix: string;
};

const resetActorScopedApiState = (dispatch: ActorBoundaryDispatch): void => {
  dispatch(lkApi.util.resetApiState());
  dispatch(lkPushApi.util.resetApiState());
  dispatch(repairRequestsApi.util.resetApiState());
};

export const transitionAfterSuccessfulLogin = ({
  status,
  dispatch,
}: LoginBoundaryDependencies): boolean => {
  if (status !== 200) return false;
  resetActorScopedApiState(dispatch);
  return true;
};

export const transitionToLoggedOut = async ({
  dispatch,
  navigate,
  serverLogout,
  sessionStorage,
  localStorage,
  savedFiltersKeyPrefix,
}: LogoutBoundaryDependencies): Promise<void> => {
  try {
    await serverLogout();
  } catch {}

  try {
    for (const key of [
      'accessToken',
      'refreshToken',
      'userData',
      'lastRefreshTime',
      'refreshTokensInterval',
    ]) {
      sessionStorage.removeItem(key);
    }
  } catch {}

  try {
    const savedFilterKeys: string[] = [];
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (key?.startsWith(savedFiltersKeyPrefix)) savedFilterKeys.push(key);
    }
    savedFilterKeys.forEach((key) => localStorage.removeItem(key));
    localStorage.removeItem('rememberMe');
  } catch {}

  resetActorScopedApiState(dispatch);
  navigate('/Authorization', { replace: true });
};
