import crypto from "node:crypto";

/**
 * Hashes a given value using SHA-256 algorithm
 * @param value - The value to hash
 * @param salt - Optional salt to add to the hash
 * @returns Promise<string> - The hashed value in hexadecimal format
 */
export const hashString = (value: string, salt?: string): string => {
  const hashInstance = crypto.createHash("sha256");

  const valueToHash = salt ? salt + value : value;

  hashInstance.update(valueToHash);
  return hashInstance.digest("hex");
};

/**
 * Verifies if a given value matches a hash
 * @param value - The value to verify
 * @param hash - The hash to compare against
 * @param salt - Optional salt that was used in the original hash
 * @returns Promise<boolean> - Whether the value matches the hash
 */
export async function verifyHash(
  value: string,
  hash: string,
  salt?: string,
): Promise<boolean> {
  const hashedValue = hashString(value, salt);
  return hashedValue === hash;
}
