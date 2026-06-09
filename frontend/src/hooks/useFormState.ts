import { useState } from "react";

export interface FormState {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  otp: string;
  role: "STUDENT";
}

export function useFormState(initial: Partial<FormState> = {}) {
  const [formState, setFormState] = useState<FormState>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    otp: "",
    role: "STUDENT",
    ...initial,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FormState, string>>
  >({});

  const updateField = (field: keyof FormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const setError = (field: keyof FormState, error: string) => {
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const clearErrors = () => {
    setErrors({});
  };

  const reset = () => {
    setFormState({
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      otp: "",
      role: "STUDENT",
    });
    setErrors({});
  };

  return {
    formState,
    errors,
    updateField,
    setError,
    clearErrors,
    reset,
    setFormState,
  };
}
