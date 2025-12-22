"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook for persisting state to localStorage with automatic JSON serialization.
 *
 * Replaces the common pattern of:
 * ```tsx
 * const [value, setValue] = useState(() => {
 *   if (typeof window === 'undefined') return defaultValue;
 *   const saved = localStorage.getItem(key);
 *   return saved ? JSON.parse(saved) : defaultValue;
 * });
 *
 * useEffect(() => {
 *   localStorage.setItem(key, JSON.stringify(value));
 * }, [value]);
 * ```
 *
 * With:
 * ```tsx
 * const [value, setValue] = useLocalStorage('key', defaultValue);
 * ```
 *
 * @param key - The localStorage key
 * @param initialValue - The initial value if nothing is stored
 *
 * @example
 * // Basic usage
 * const [theme, setTheme] = useLocalStorage('theme', 'dark');
 *
 * @example
 * // With objects
 * const [settings, setSettings] = useLocalStorage('settings', {
 *   notifications: true,
 *   autoPlay: false,
 * });
 *
 * @example
 * // With arrays
 * const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('searches', []);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Prevent SSR issues
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      // Parse stored json or return initialValue
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch (error) {
      // If error (e.g., invalid JSON), return initial value
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes in other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue) as T);
        } catch {
          // Ignore parse errors from other sources
        }
      } else if (e.key === key && e.newValue === null) {
        // Item was removed
        setStoredValue(initialValue);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      return () => window.removeEventListener("storage", handleStorageChange);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for boolean localStorage values with toggle functionality.
 *
 * @example
 * const [isDarkMode, setIsDarkMode, toggleDarkMode] = useLocalStorageBoolean('darkMode', true);
 *
 * <button onClick={toggleDarkMode}>Toggle Dark Mode</button>
 */
export function useLocalStorageBoolean(
  key: string,
  initialValue: boolean = false
): [boolean, (value: boolean) => void, () => void] {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, [setValue]);

  return [value, setValue, toggle];
}

/**
 * Hook for array localStorage values with common array operations.
 *
 * @example
 * const {
 *   items: recentVideos,
 *   add: addVideo,
 *   remove: removeVideo,
 *   clear: clearVideos,
 * } = useLocalStorageArray<string>('recentVideos', []);
 *
 * // Add to recent videos
 * addVideo(videoId);
 *
 * // Remove specific video
 * removeVideo(videoId);
 */
export function useLocalStorageArray<T>(
  key: string,
  initialValue: T[] = []
): {
  items: T[];
  add: (item: T) => void;
  remove: (item: T) => void;
  clear: () => void;
  set: (items: T[]) => void;
} {
  const [items, setItems, removeAll] = useLocalStorage<T[]>(key, initialValue);

  const add = useCallback(
    (item: T) => {
      setItems((prev) => {
        // Avoid duplicates for primitive types
        if (prev.includes(item)) {
          return prev;
        }
        return [...prev, item];
      });
    },
    [setItems]
  );

  const remove = useCallback(
    (item: T) => {
      setItems((prev) => prev.filter((i) => i !== item));
    },
    [setItems]
  );

  return {
    items,
    add,
    remove,
    clear: removeAll,
    set: setItems,
  };
}

export default useLocalStorage;
