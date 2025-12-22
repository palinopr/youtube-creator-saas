/**
 * Custom React hooks for TubeGrow
 *
 * @example
 * import { useAsync, useLocalStorage, useForm } from '@/hooks';
 */

export {
  useAsync,
  useLazyAsync,
  type UseAsyncState,
  type UseAsyncReturn,
  type UseAsyncOptions,
} from "./useAsync";

export {
  useLocalStorage,
  useLocalStorageBoolean,
  useLocalStorageArray,
} from "./useLocalStorage";

export {
  useForm,
  useSimpleForm,
  type UseFormState,
  type UseFormOptions,
  type UseFormReturn,
  type ValidateFn,
} from "./useForm";

// Re-export existing hooks
export { useDashboardData, type DailyAnalytics } from "./useDashboardData";
