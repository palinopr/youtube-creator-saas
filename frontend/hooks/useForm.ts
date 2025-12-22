"use client";

import { useState, useCallback, useMemo, useRef } from "react";

/**
 * Validation function type
 */
export type ValidateFn<T> = (values: T) => Partial<Record<keyof T, string>>;

/**
 * Form state
 */
export interface UseFormState<T> {
  /** Current form values */
  values: T;
  /** Validation errors keyed by field name */
  errors: Partial<Record<keyof T, string>>;
  /** Fields that have been touched (interacted with) */
  touched: Partial<Record<keyof T, boolean>>;
  /** Whether form is currently submitting */
  submitting: boolean;
  /** Whether form has been submitted at least once */
  submitted: boolean;
  /** Whether form values have changed from initial */
  isDirty: boolean;
  /** Whether form is valid (no errors) */
  isValid: boolean;
}

/**
 * Form options
 */
export interface UseFormOptions<T> {
  /** Validation function - returns object with field errors */
  validate?: ValidateFn<T>;
  /** Validate on every change (default: false - only on blur/submit) */
  validateOnChange?: boolean;
  /** Validate on blur (default: true) */
  validateOnBlur?: boolean;
  /** Called on successful form submission */
  onSubmit?: (values: T) => void | Promise<void>;
  /** Called when submission fails */
  onError?: (errors: Partial<Record<keyof T, string>>) => void;
}

/**
 * Form return type
 */
export interface UseFormReturn<T> extends UseFormState<T> {
  /** Set a single field value */
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  /** Set multiple field values at once */
  setFields: (values: Partial<T>) => void;
  /** Set a field error manually */
  setError: (field: keyof T, error: string | null) => void;
  /** Mark a field as touched */
  setTouched: (field: keyof T, touched?: boolean) => void;
  /** Reset form to initial values */
  reset: (newInitialValues?: T) => void;
  /** Submit the form (validates and calls onSubmit) */
  submit: () => Promise<void>;
  /** Get props for an input field */
  getFieldProps: (field: keyof T) => {
    value: T[keyof T];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    name: string;
  };
  /** Validate all fields */
  validateForm: () => boolean;
}

/**
 * Hook for managing form state with validation support.
 *
 * Replaces the common pattern of:
 * ```tsx
 * const [title, setTitle] = useState('');
 * const [description, setDescription] = useState('');
 * const [errors, setErrors] = useState({});
 * const [submitting, setSubmitting] = useState(false);
 *
 * const handleSubmit = async () => {
 *   setSubmitting(true);
 *   // validation logic...
 *   // submit logic...
 *   setSubmitting(false);
 * };
 * ```
 *
 * With:
 * ```tsx
 * const form = useForm({ title: '', description: '' }, {
 *   validate: (v) => ({ title: !v.title ? 'Required' : undefined }),
 *   onSubmit: async (values) => { await api.save(values); },
 * });
 * ```
 *
 * @param initialValues - Initial form values
 * @param options - Form options (validate, onSubmit, etc.)
 *
 * @example
 * // Basic usage
 * const form = useForm({ email: '', password: '' });
 *
 * <input
 *   {...form.getFieldProps('email')}
 *   type="email"
 * />
 * {form.errors.email && <span>{form.errors.email}</span>}
 *
 * @example
 * // With validation
 * const form = useForm(
 *   { title: '', tags: [] as string[] },
 *   {
 *     validate: (values) => {
 *       const errors: Record<string, string> = {};
 *       if (!values.title) errors.title = 'Title is required';
 *       if (values.title.length > 100) errors.title = 'Title too long';
 *       if (values.tags.length === 0) errors.tags = 'Add at least one tag';
 *       return errors;
 *     },
 *     onSubmit: async (values) => {
 *       await api.updateVideo(videoId, values);
 *       toast.success('Saved!');
 *     },
 *   }
 * );
 *
 * @example
 * // Video editor pattern (from video/[id]/page.tsx)
 * const form = useForm({
 *   title: video?.title ?? '',
 *   description: video?.description ?? '',
 *   tags: video?.tags ?? [],
 * }, {
 *   validate: (v) => ({
 *     title: v.title.length > 100 ? 'Max 100 characters' : undefined,
 *     description: v.description.length > 5000 ? 'Max 5000 characters' : undefined,
 *   }),
 *   onSubmit: async (values) => {
 *     await api.updateVideoMetadata(videoId, values);
 *   },
 * });
 */
export function useForm<T extends Record<string, unknown>>(
  initialValues: T,
  options: UseFormOptions<T> = {}
): UseFormReturn<T> {
  const {
    validate,
    validateOnChange = false,
    validateOnBlur = true,
    onSubmit,
    onError,
  } = options;

  // Store initial values ref for reset and dirty checking
  const initialValuesRef = useRef(initialValues);

  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedState] = useState<Partial<Record<keyof T, boolean>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Check if form is dirty (values changed from initial)
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValuesRef.current);
  }, [values]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: T[keyof T]): string | undefined => {
      if (!validate) return undefined;
      const fieldErrors = validate({ ...values, [field]: value });
      return fieldErrors[field];
    },
    [validate, values]
  );

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    if (!validate) return true;
    const newErrors = validate(values);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [validate, values]);

  // Set a single field
  const setField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));

      if (validateOnChange && validate) {
        const error = validateField(field, value);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const { [field]: _, ...rest } = prev;
          return rest as Partial<Record<keyof T, string>>;
        });
      }
    },
    [validateOnChange, validate, validateField]
  );

  // Set multiple fields
  const setFields = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  // Set error manually
  const setError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      }
      const { [field]: _, ...rest } = prev;
      return rest as Partial<Record<keyof T, string>>;
    });
  }, []);

  // Set touched
  const setTouched = useCallback((field: keyof T, isTouched = true) => {
    setTouchedState((prev) => ({ ...prev, [field]: isTouched }));
  }, []);

  // Handle blur
  const handleBlur = useCallback(
    (field: keyof T) => {
      setTouched(field, true);

      if (validateOnBlur && validate) {
        const error = validateField(field, values[field]);
        setErrors((prev) => {
          if (error) {
            return { ...prev, [field]: error };
          }
          const { [field]: _, ...rest } = prev;
          return rest as Partial<Record<keyof T, string>>;
        });
      }
    },
    [setTouched, validateOnBlur, validate, validateField, values]
  );

  // Reset form
  const reset = useCallback((newInitialValues?: T) => {
    const resetValues = newInitialValues ?? initialValuesRef.current;
    if (newInitialValues) {
      initialValuesRef.current = newInitialValues;
    }
    setValues(resetValues);
    setErrors({});
    setTouchedState({});
    setSubmitted(false);
  }, []);

  // Submit form
  const submit = useCallback(async () => {
    setSubmitted(true);

    // Validate all fields
    if (!validateForm()) {
      onError?.(errors);
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.(values);
    } catch (err) {
      // Re-throw for caller to handle if needed
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, onSubmit, onError, values, errors]);

  // Get field props helper
  const getFieldProps = useCallback(
    (field: keyof T) => ({
      value: values[field] as T[keyof T],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      ) => {
        const target = e.target;
        const value =
          target.type === "checkbox"
            ? (target as HTMLInputElement).checked
            : target.value;
        setField(field, value as T[keyof T]);
      },
      onBlur: () => handleBlur(field),
      name: String(field),
    }),
    [values, setField, handleBlur]
  );

  return {
    values,
    errors,
    touched,
    submitting,
    submitted,
    isDirty,
    isValid,
    setField,
    setFields,
    setError,
    setTouched,
    reset,
    submit,
    getFieldProps,
    validateForm,
  };
}

/**
 * Simplified form hook for basic use cases without validation.
 *
 * @example
 * const { values, setField, reset } = useSimpleForm({
 *   search: '',
 *   filter: 'all',
 * });
 */
export function useSimpleForm<T extends Record<string, unknown>>(
  initialValues: T
): {
  values: T;
  setField: <K extends keyof T>(field: K, value: T[K]) => void;
  setFields: (values: Partial<T>) => void;
  reset: () => void;
  isDirty: boolean;
} {
  const initialRef = useRef(initialValues);
  const [values, setValues] = useState<T>(initialValues);

  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setFields = useCallback((newValues: Partial<T>) => {
    setValues((prev) => ({ ...prev, ...newValues }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialRef.current);
  }, []);

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialRef.current);
  }, [values]);

  return { values, setField, setFields, reset, isDirty };
}

export default useForm;
