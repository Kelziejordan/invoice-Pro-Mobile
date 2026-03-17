// filepath: src/types/remote-data.ts
export type RemoteData<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E; metadata?: Record<string, unknown> };

export const RemoteData = {
  idle: <T, E = Error>(): RemoteData<T, E> => ({ status: 'idle' }),
  loading: <T, E = Error>(): RemoteData<T, E> => ({ status: 'loading' }),
  success: <T, E = Error>(data: T): RemoteData<T, E> => ({ status: 'success', data }),
  error: <T, E = Error>(error: E, metadata?: Record<string, unknown>): RemoteData<T, E> => ({
    status: 'error',
    error,
    metadata,
  }),
  isIdle: <T, E>(rd: RemoteData<T, E>): rd is Extract<RemoteData<T, E>, { status: 'idle' }> => rd.status === 'idle',
  isLoading: <T, E>(rd: RemoteData<T, E>): rd is Extract<RemoteData<T, E>, { status: 'loading' }> => rd.status === 'loading',
  isSuccess: <T, E>(rd: RemoteData<T, E>): rd is Extract<RemoteData<T, E>, { status: 'success' }> => rd.status === 'success',
  isError: <T, E>(rd: RemoteData<T, E>): rd is Extract<RemoteData<T, E>, { status: 'error' }> => rd.status === 'error',
};
