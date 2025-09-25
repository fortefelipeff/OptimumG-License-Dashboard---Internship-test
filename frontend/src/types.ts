export type LicenseStatus = "active" | "inactive" | "expired" | "pending" | "revoked";
export type LicenseTier = "trial" | "standard" | "professional" | "enterprise";

export interface Activation {
  machineId: string;
  activatedBy: string;
  activatedAt: string;
  lastHeartbeat: string | null;
}

export interface License {
  key: string;
  productName: string;
  ownerName: string;
  tier: LicenseTier;
  status: LicenseStatus;
  issuedAt: string;
  expiresAt: string;
  activationLimit: number;
  notes: string;
  activations: Activation[];
  remainingDays: number;
}

export interface LicenseStatusSummary {
  status: LicenseStatus;
  remainingDays: number;
  expired: boolean;
}

