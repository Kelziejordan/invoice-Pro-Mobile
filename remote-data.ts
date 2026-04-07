export type RemoteData<T, E = Error> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: E; metadata?: Record<string, unknown> };

export const remoteIdle = (): RemoteData<never, never> => ({ status: 'idle' });
export const remoteLoading = (): RemoteData<never, never> => ({ status: 'loading' });
export const remoteSuccess = <T>(data: T): RemoteData<T, never> => ({ status: 'success', data });
export const remoteError = <E>(error: E, metadata?: Record<string, unknown>): RemoteData<never, E> => ({ 
  status: 'error', 
  error, 
  metadata 
});
