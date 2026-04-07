// filepath: src/hooks/usePersistentData.ts
import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

export function usePersistentData<T>(
  key: string,
  schema: z.ZodType<T>,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Read initial state from localStorage or use fallback
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        const validated = schema.safeParse(parsed);
        if (validated.success) {
          return validated.data;
        } else {
          console.warn(`[usePersistentData] Validation failed for key "${key}". Falling back to initialValue.`, validated.error);
        }
      }
    } catch (error) {
      console.error(`[usePersistentData] Error reading key "${key}" from localStorage.`, error);
    }
    return initialValue;
  });

  // Sync to localStorage whenever state changes
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(state) : value;
        setState(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`[usePersistentData] Error setting key "${key}" to localStorage.`, error);
      }
    },
    [key, state]
  );

  return [state, setValue];
}
