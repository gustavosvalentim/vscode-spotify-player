import * as crypto from "node:crypto";

export const generateRandomString = (length: number) => {
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], "");
};

export const sha256 = async (plain: string): Promise<ArrayBuffer> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
};

export const base64encode = (input: ArrayBuffer): string => {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
};

export const generateCodeVerifier = (): string => {
  return generateRandomString(64);
};

export const generateCodeChallenge = async (
  verifier: string
): Promise<string> => {
  const hashed = await sha256(verifier);
  return base64encode(hashed);
};
