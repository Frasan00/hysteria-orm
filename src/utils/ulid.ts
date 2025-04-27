import { randomBytes } from "crypto";

const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const ENCODING_LEN = ENCODING.length;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

/**
 * Encodes a number to Base32 string
 */
const encodeTime = (now: number, length: number): string => {
  let str = "";
  for (let i = 0; i < length; i++) {
    let mod = now % ENCODING_LEN;
    str = ENCODING.charAt(mod) + str;
    now = (now - mod) / ENCODING_LEN;
  }
  return str;
};

/**
 * Generates random bytes and encodes them to Base32
 */
const encodeRandom = (length: number): string => {
  const bytes = randomBytes(length);
  let str = "";
  for (let i = 0; i < length; i++) {
    const randomByte = bytes[i];
    str += ENCODING.charAt(randomByte % ENCODING_LEN);
  }
  return str;
};

/**
 * Generates a ULID (Universally Unique Lexicographically Sortable Identifier) string, 26 characters long
 */
export const generateULID = (): string => {
  const now = Math.floor(Date.now() / 1000);
  const time = encodeTime(now, TIME_LEN);
  const random = encodeRandom(RANDOM_LEN);
  return time + random;
};
