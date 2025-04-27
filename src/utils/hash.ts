import crypto from "crypto";

/**
 * Hashes a given value using SHA-256 algorithm
 * @param value - The value to hash
 * @param salt - Optional salt to add to the hash
 * @returns Promise<string> - The hashed value in hexadecimal format
 */
export async function hash(value: string, salt?: string): Promise<string> {
  const hashInstance = crypto.createHash("sha256");

  // If salt is provided, prepend it to the value
  const valueToHash = salt ? salt + value : value;

  hashInstance.update(valueToHash);
  return hashInstance.digest("hex");
}

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
  const hashedValue = await hash(value, salt);
  return hashedValue === hash;
}
