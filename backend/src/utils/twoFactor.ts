import { OTP } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";

const otp = new OTP({ strategy: "totp" });

export function generateTwoFactorSecret(): string {
  return otp.generateSecret();
}

export function getOtpAuthUrl(email: string, secret: string): string {
  return otp.generateURI({
    issuer: "Relay",
    label: email,
    secret,
  });
}

export async function generateQrCodeDataUrl(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl);
}

export async function verifyTwoFactorToken(token: string, secret: string): Promise<boolean> {
  const result = await otp.verify({ secret, token });
  return result.valid;
}

export function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex")
  );
}