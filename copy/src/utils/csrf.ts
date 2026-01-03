import { API_BASE_URL } from '../constants';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);
const DEFAULT_API_PATH_PREFIX = '/api';
const CSRF_COOKIE_NAME = 'csrfToken';

let csrfTokenCache: string | null = null;

const getWindowOrigin = (): string | null =>
  typeof window !== 'undefined' ? window.location.origin : null;

const { apiOrigin, apiPathPrefix } = (() => {
  try {
    const parsed = new URL(API_BASE_URL, getWindowOrigin() ?? undefined);
    return {
      apiOrigin: parsed.origin,
      apiPathPrefix: parsed.pathname.replace(/\/$/, '') || DEFAULT_API_PATH_PREFIX,
    };
  } catch {
    if (API_BASE_URL.startsWith('/')) {
      return {
        apiOrigin: null,
        apiPathPrefix: API_BASE_URL.replace(/\/$/, '') || DEFAULT_API_PATH_PREFIX,
      };
    }
    return {
      apiOrigin: getWindowOrigin(),
      apiPathPrefix: DEFAULT_API_PATH_PREFIX,
    };
  }
})();

const resolveCsrfEndpoint = (): string => {
  if (apiOrigin) {
    return `${apiOrigin}${apiPathPrefix}/csrf-token`;
  }
  return `${apiPathPrefix}/csrf-token`;
};

export const readCsrfTokenFromCookie = (): string | null => {
  if (typeof document === 'undefined') {
    return null;
  }
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${CSRF_COOKIE_NAME}=([^;]*)`)
  );
  return match ? decodeURIComponent(match[1]) : null;
};

export const setCsrfToken = (token: string | null): void => {
  csrfTokenCache = token || readCsrfTokenFromCookie();
};

export const ensureCsrfToken = async (): Promise<string | null> => {
  if (!csrfTokenCache) {
    csrfTokenCache = readCsrfTokenFromCookie();
  }

  if (csrfTokenCache || typeof fetch === 'undefined') {
    return csrfTokenCache;
  }

  try {
    const response = await fetch(resolveCsrfEndpoint(), {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });
    if (response.ok) {
      const data = await response
        .clone()
        .json()
        .catch(() => ({} as { csrfToken?: string }));
      csrfTokenCache = data.csrfToken || readCsrfTokenFromCookie();
    } else {
      csrfTokenCache = readCsrfTokenFromCookie();
    }
  } catch {
    csrfTokenCache = readCsrfTokenFromCookie();
  }

  return csrfTokenCache;
};

const isSameApiOrigin = (url: URL): boolean => {
  if (apiOrigin) {
    return url.origin === apiOrigin;
  }
  const origin = getWindowOrigin();
  return origin ? url.origin === origin : true;
};

const isApiRequest = (url: URL): boolean => {
  if (!isSameApiOrigin(url)) {
    return false;
  }
  return url.pathname.startsWith(apiPathPrefix);
};

export const shouldAttachCsrfToRequest = (
  input: RequestInfo | URL,
  init?: RequestInit
): { attach: boolean; url?: URL; method?: string } => {
  if (typeof window === 'undefined') {
    return { attach: false };
  }

  const method = (
    init?.method ||
    (input instanceof Request ? input.method : 'GET')
  ).toUpperCase();

  if (SAFE_METHODS.has(method)) {
    return { attach: false };
  }

  let url: URL;
  try {
    if (input instanceof Request) {
      url = new URL(input.url, window.location.origin);
    } else if (input instanceof URL) {
      url = new URL(input.href);
    } else {
      url = new URL(input.toString(), window.location.origin);
    }
  } catch {
    return { attach: false };
  }

  if (!isApiRequest(url)) {
    return { attach: false };
  }

  return { attach: true, url, method };
};

