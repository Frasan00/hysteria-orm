import { col, defineModel } from "../../../../../src/sql/models/define_model";

/**
 * Encryption column family.
 * v1: symmetric encryption column
 * v2: asymmetric (public/private key pair)
 */
export const EncryptionColumnsV1 = defineModel("schema_diff_pgmy_encryption", {
  columns: {
    id: col.bigIncrement(),
    secret: col.encryption.symmetric({
      key: "0123456789abcdef0123456789abcdef",
      type: "text",
    }),
  },
});

export const EncryptionColumnsV2 = defineModel("schema_diff_pgmy_encryption", {
  columns: {
    id: col.bigIncrement(),
    secret: col.encryption.asymmetric({
      publicKey: "-----BEGIN PUBLIC KEY-----abc",
      privateKey: "-----BEGIN PRIVATE KEY-----def",
      type: "text",
    }),
  },
});
