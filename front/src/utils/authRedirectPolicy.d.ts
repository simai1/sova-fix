export type AuthRedirectError = {
  response?: { status?: number };
  config?: { _retry?: boolean; _skipAuthRefresh?: boolean };
};

export declare const isAuthPath: (pathname: string) => boolean;

export declare const shouldRedirectStatusToAuthorization: (
  status?: number,
  pathname?: string,
) => boolean;

export declare const shouldRedirectToAuthorization: (
  error: AuthRedirectError,
  pathname?: string,
) => boolean;
