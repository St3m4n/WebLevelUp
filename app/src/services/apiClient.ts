const resolveBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/?$/, '');
  }
  return 'https://backleveluprail-production.up.railway.app/api/v1';
};

const API_BASE_URL = resolveBaseUrl();

let currentAuthToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  currentAuthToken = token ? token.trim() : null;
};

export const getAuthToken = (): string | null => currentAuthToken;

export class ApiError extends Error {
  status: number;

  details: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export type FetchOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  auth?: boolean;
  timeoutMs?: number;
};

const createAbortSignalWithTimeout = (timeoutMs: number): AbortSignal => {
  const controller = new AbortController();
  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    setTimeout(() => controller.abort(), timeoutMs);
  }
  return controller.signal;
};

export const apiFetch = async <T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> => {
  const {
    method = 'GET',
    headers = {},
    body,
    signal,
    auth = true,
    timeoutMs,
  } = options;

  const mergedHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (!(body instanceof FormData)) {
      mergedHeaders['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    } else {
      payload = body;
    }
  }

  if (auth && currentAuthToken) {
    mergedHeaders.Authorization = `Bearer ${currentAuthToken}`;
  }

  const timeoutSignal = timeoutMs
    ? createAbortSignalWithTimeout(timeoutMs)
    : null;

  const controller = new AbortController();
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
    } else {
      signal.addEventListener('abort', onAbort);
    }
  }

  if (timeoutSignal) {
    if (timeoutSignal.aborted) {
      controller.abort();
    } else {
      timeoutSignal.addEventListener('abort', onAbort);
    }
  }

  try {
    const requestUrl = API_BASE_URL + endpoint;
    const response = await fetch(requestUrl, {
      method,
      headers: mergedHeaders,
      body: payload,
      signal: controller.signal,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const responseBody = isJson
      ? await response.json().catch(() => null)
      : null;

    if (!response.ok) {
      throw new ApiError(
        response.status,
        responseBody?.message || response.statusText || 'Error en la solicitud',
        responseBody
      );
    }

    return (responseBody as T) ?? (undefined as T);
  } finally {
    if (signal) {
      signal.removeEventListener('abort', onAbort);
    }
    if (timeoutSignal) {
      timeoutSignal.removeEventListener('abort', onAbort);
    }
  }
};

export const apiGet = <T>(endpoint: string, options?: FetchOptions) =>
  apiFetch<T>(endpoint, { ...options, method: 'GET' });

export const apiPost = <T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions
) => apiFetch<T>(endpoint, { ...options, method: 'POST', body });

export const apiPut = <T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions
) => apiFetch<T>(endpoint, { ...options, method: 'PUT', body });

export const apiPatch = <T>(
  endpoint: string,
  body?: unknown,
  options?: FetchOptions
) => apiFetch<T>(endpoint, { ...options, method: 'PATCH', body });

export const apiDelete = <T>(endpoint: string, options?: FetchOptions) =>
  apiFetch<T>(endpoint, { ...options, method: 'DELETE' });
