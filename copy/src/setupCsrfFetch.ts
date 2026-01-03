import { ensureCsrfToken, setCsrfToken, readCsrfTokenFromCookie, shouldAttachCsrfToRequest } from './utils/csrf';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'TRACE']);

declare global {
  interface Window {
    __csrfFetchPatched__?: boolean;
  }
}

if (typeof window !== 'undefined' && typeof window.fetch === 'function' && !window.__csrfFetchPatched__) {
  const originalFetch = window.fetch.bind(window);
  window.__csrfFetchPatched__ = true;

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const request = new Request(input, init);
    const method = request.method.toUpperCase();

    const { attach } = shouldAttachCsrfToRequest(request, init);

    let preparedRequest = request;
    if (attach && !SAFE_METHODS.has(method)) {
      const headers = new Headers(request.headers);
      const token = await ensureCsrfToken();
      if (token) {
        headers.set('X-CSRF-Token', token);
      }

      const credentials = request.credentials === 'omit' ? 'omit' : 'include';
      preparedRequest = new Request(request, {
        headers,
        credentials,
      });
    }

    const response = await originalFetch(preparedRequest);
    const headerToken = response.headers.get('X-CSRF-Token');
    if (headerToken) {
      setCsrfToken(headerToken);
    } else {
      setCsrfToken(readCsrfTokenFromCookie());
    }
    return response;
  };
}

