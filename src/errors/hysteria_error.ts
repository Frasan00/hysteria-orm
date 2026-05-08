import { HysteriaErrorCode } from "./hysteria_error.types";

export class HysteriaError extends Error {
  code: HysteriaErrorCode;
  caller: string;
  error?: Error;

  constructor(caller: string, code: HysteriaErrorCode, error?: Error) {
    super(caller + " - " + code);
    this.code = code;
    this.caller = caller;
    this.error = error;
  }
}

// Validation error dedicated to per-column validation failures
export class ValidationError extends HysteriaError {
  errors: Record<string, string[]>;

  constructor(errors: Record<string, string[]>) {
    super("ValidationError", "VALIDATION_ERROR");
    this.errors = errors;
  }
}
