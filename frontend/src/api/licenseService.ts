import { apiClient } from "./client";
import type { License, LicenseStatusSummary } from "../types";

interface ApiResponse<T> {
  data: T;
  error?: string;
}

export async function fetchLicenses() {
  const response = await apiClient.get<ApiResponse<License[]>>("/licenses");
  return response.data.data;
}

export async function fetchLicense(key: string) {
  const response = await apiClient.get<ApiResponse<License | null>>(`/licenses/${key}`);
  return response.data.data;
}

export async function activateLicense(licenseKey: string, machineId: string, activatedBy: string) {
  const response = await apiClient.post<ApiResponse<License>>(`/licenses/${licenseKey}/activate`, {
    machineId,
    activatedBy,
  });
  return response.data.data;
}

export async function deactivateLicense(licenseKey: string, machineId: string) {
  const response = await apiClient.post<ApiResponse<License>>(`/licenses/${licenseKey}/deactivate`, {
    machineId,
  });
  return response.data.data;
}

export async function fetchLicenseStatus(key: string) {
  const response = await apiClient.get<ApiResponse<LicenseStatusSummary>>(`/licenses/${key}/status`);
  return response.data.data;
}

