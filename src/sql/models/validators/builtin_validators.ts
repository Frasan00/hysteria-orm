import type { ValidationResult, Validator } from "./validator";

/**
 * @description Field is required and will throw if not provided
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const required: Validator = (value, _ctx): ValidationResult => {
  const ok = value !== undefined && value !== null && value !== "";
  return ok ? { valid: true } : { valid: false, message: "Value is required" };
};

/**
 * @description Field must have a minimum length, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const minLength = (min: number): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "string") {
      return { valid: false, message: "Value must be a string" };
    }
    return value.length >= min
      ? { valid: true }
      : { valid: false, message: `Minimum length is ${min}` };
  };
};

/**
 * @description Field must have a maximum length, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const maxLength = (max: number): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "string") {
      return { valid: false, message: "Value must be a string" };
    }
    return value.length <= max
      ? { valid: true }
      : { valid: false, message: `Maximum length is ${max}` };
  };
};

/**
 * @description Field must have a minimum value, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const min = (minValue: number): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "number") {
      return { valid: false, message: "Value must be a number" };
    }
    return value >= minValue
      ? { valid: true }
      : { valid: false, message: `Minimum value is ${minValue}` };
  };
};

/**
 * @description Field must have a maximum value, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const max = (maxValue: number): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "number") {
      return { valid: false, message: "Value must be a number" };
    }
    return value <= maxValue
      ? { valid: true }
      : { valid: false, message: `Maximum value is ${maxValue}` };
  };
};

/**
 * @description Field must match a regex, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const pattern = (regex: RegExp): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "string") {
      return { valid: false, message: "Value must be a string" };
    }
    return regex.test(value)
      ? { valid: true }
      : { valid: false, message: `Value does not match pattern` };
  };
};

/**
 * @description Field must be a valid email, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const email: Validator = (value, _ctx): ValidationResult => {
  if (value == null) return { valid: true };
  if (typeof value !== "string")
    return { valid: false, message: "Invalid email" };
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value)
    ? { valid: true }
    : { valid: false, message: "Invalid email" };
};

/**
 * @description Field must be a valid url, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const url: Validator = (value, _ctx): ValidationResult => {
  if (value == null) return { valid: true };
  if (typeof value !== "string")
    return { valid: false, message: "Invalid url" };
  try {
    new URL(value);
    return { valid: true };
  } catch {
    return { valid: false, message: "Invalid url" };
  }
};

/**
 * @description Field must be a valid enum value, null is allowed
 * @throws HysteriaError with code VALIDATION_ERROR
 */
export const enumValidator = (allowed: readonly string[]): Validator => {
  return (value, _ctx): ValidationResult => {
    if (value == null) return { valid: true };
    if (typeof value !== "string")
      return { valid: false, message: "Invalid enum value" };
    return allowed.includes(value)
      ? { valid: true }
      : {
          valid: false,
          message: `Value must be one of: ${allowed.join(", ")}`,
        };
  };
};
