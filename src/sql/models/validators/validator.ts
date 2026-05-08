// Core types for the validation system
export type ValidationResult = {
  valid: boolean;
  message?: string;
};

export type ValidationContext = {
  model: any; // constructor function (class) of the model
  column: string;
  operation: "insert" | "update";
  data: any;
};

export type Validator = (
  value: any,
  context: ValidationContext,
) => ValidationResult | Promise<ValidationResult>;
