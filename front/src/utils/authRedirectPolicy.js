const AUTH_PATHS = ['/Authorization', '/reset-password', '/reset-password-request', '/Activate']

export const isAuthPath = (pathname) => AUTH_PATHS.some((path) => pathname.startsWith(path))

export const shouldRedirectStatusToAuthorization = (status, pathname = window.location.pathname) =>
  status === 401 && !isAuthPath(pathname)

export const shouldRedirectToAuthorization = (error, pathname = window.location.pathname) =>
  !error?.config?._retry &&
  !error?.config?._skipAuthRefresh &&
  shouldRedirectStatusToAuthorization(error?.response?.status, pathname)
