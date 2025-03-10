import { HysteriaErrorCode } from "./hysteria_error.types";

export class HysteriaError extends Error {
  code: HysteriaErrorCode;
  caller: string;

  constructor(caller: string, code: HysteriaErrorCode) {
    super(caller + " - " + code);
    this.code = code;
    this.caller = caller;
  }
}
