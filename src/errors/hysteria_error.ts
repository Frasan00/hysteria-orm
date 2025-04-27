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
