import crypto from "crypto";

// Ensure this key is exactly 32 bytes (64 hex characters) in your environment
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || "0000000000000000000000000000000000000000000000000000000000000000";
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a given text using AES-256-GCM.
 * Used for securely storing Google OAuth tokens in the database.
 */
export function encryptToken(text: string): string {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, "hex");
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted token.
 */
export function decryptToken(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  try {
    const textParts = encryptedText.split(":");
    if (textParts.length !== 3) return encryptedText; // Probably not encrypted
    
    const iv = Buffer.from(textParts[0], "hex");
    const authTag = Buffer.from(textParts[1], "hex");
    const encryptedData = Buffer.from(textParts[2], "hex");
    const key = Buffer.from(ENCRYPTION_KEY, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData, undefined, "utf8");
    decrypted += decipher.final("utf8");
    
    return decrypted;
  } catch (error) {
    console.error("Token decryption failed:", error);
    return "";
  }
}
