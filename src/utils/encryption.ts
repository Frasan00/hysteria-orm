import crypto, { privateDecrypt, publicEncrypt } from "node:crypto";
import { HysteriaError } from "../errors/hysteria_error";

// #region Symmetric Encryption
export const encryptSymmetric = (key: string, value: string): string => {
  try {
    const keyBuffer = crypto.createHash("sha256").update(key).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
    let encrypted = cipher.update(value, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    throw new HysteriaError(
      "Encryption::encryptSymmetric",
      "FAILED_TO_ENCRYPT_SYMMETRICALLY",
      error instanceof Error ? error : undefined,
    );
  }
};

export const decryptSymmetric = (key: string, value: string): string => {
  try {
    const keyBuffer = crypto.createHash("sha256").update(key).digest();
    const [ivHex, encrypted] = value.split(":");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      keyBuffer,
      Buffer.from(ivHex, "hex"),
    );
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    throw new HysteriaError(
      "Encryption::decryptSymmetric",
      "FAILED_TO_DECRYPT_SYMMETRICALLY",
      error instanceof Error ? error : undefined,
    );
  }
};
// #endregion

// #region Asymmetric Encryption
export const encryptAsymmetric = (publicKey: string, value: string): string => {
  try {
    // Generate a random symmetric key
    const symmetricKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    // Encrypt the data with AES
    const cipher = crypto.createCipheriv("aes-256-cbc", symmetricKey, iv);
    let encryptedData = cipher.update(value, "utf8", "hex");
    encryptedData += cipher.final("hex");

    // Encrypt the symmetric key with RSA
    const encryptedKey = publicEncrypt(publicKey, symmetricKey);

    // Combine all components
    return `${iv.toString("hex")}:${encryptedKey.toString("hex")}:${encryptedData}`;
  } catch (error) {
    throw new HysteriaError(
      "Encryption::encryptAsymmetric",
      "FAILED_TO_ENCRYPT_ASYMMETRICALLY",
      error instanceof Error ? error : undefined,
    );
  }
};

export const decryptAsymmetric = (
  privateKey: string,
  value: string,
): string => {
  try {
    const [ivHex, encryptedKeyHex, encryptedData] = value.split(":");

    const symmetricKey = privateDecrypt(
      privateKey,
      Buffer.from(encryptedKeyHex, "hex"),
    );

    const decipher = crypto.createDecipheriv(
      "aes-256-cbc",
      symmetricKey,
      Buffer.from(ivHex, "hex"),
    );

    let decrypted = decipher.update(encryptedData, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    throw new HysteriaError(
      "Encryption::decryptAsymmetric",
      "FAILED_TO_DECRYPT_ASYMMETRICALLY",
      error instanceof Error ? error : undefined,
    );
  }
};
// #endregion

export const generateKeyPair = (): {
  publicKey: string;
  privateKey: string;
} => {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 4096,
  });

  return {
    publicKey: publicKey.export({ type: "spki", format: "pem" }).toString(),
    privateKey: privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
  };
};
