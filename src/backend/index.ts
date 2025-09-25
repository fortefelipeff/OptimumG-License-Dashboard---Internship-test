import path from "path";

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

interface LicenseAddon {
  hello(): string;
  listLicenses(): License[];
  getLicense(key: string): License | null;
  activate(key: string, payload: { machineId: string; activatedBy?: string; lastHeartbeat?: string | null }): boolean;
  deactivate(key: string, machineId: string): boolean;
  checkExpiration(key: string): boolean;
  remainingDays(key: string): number;
  licenseStatus(key: string): LicenseStatus;
}

export class LicenseOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LicenseOperationError";
  }
}

const addonPath = path.join(__dirname, "..", "..", "build", "Release", "addon");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const addon: LicenseAddon = require(addonPath);

class LicenseService {
  listLicenses(): License[] {
    return addon.listLicenses();
  }

  getLicense(key: string): License | null {
    return addon.getLicense(key);
  }

  activate(licenseKey: string, machineId: string, activatedBy: string): License {
    const success = addon.activate(licenseKey, { machineId, activatedBy });
    if (!success) {
      throw new LicenseOperationError("Unable to activate machine for license");
    }
    const updated = this.getLicense(licenseKey);
    if (!updated) {
      throw new LicenseOperationError("License not found after activation");
    }
    return updated;
  }

  deactivate(licenseKey: string, machineId: string): License {
    const success = addon.deactivate(licenseKey, machineId);
    if (!success) {
      throw new LicenseOperationError("Unable to deactivate machine for license");
    }
    const updated = this.getLicense(licenseKey);
    if (!updated) {
      throw new LicenseOperationError("License not found after deactivation");
    }
    return updated;
  }

  getStatus(licenseKey: string): { status: LicenseStatus; remainingDays: number; expired: boolean } {
    const status = addon.licenseStatus(licenseKey);
    const remainingDays = addon.remainingDays(licenseKey);
    const expired = addon.checkExpiration(licenseKey);
    return { status, remainingDays, expired };
  }
}

export const licenseService = new LicenseService();
