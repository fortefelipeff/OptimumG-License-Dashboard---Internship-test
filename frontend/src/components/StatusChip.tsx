import { Chip } from "@mui/material";
import type { LicenseStatus } from "../types";

const labelMap: Record<LicenseStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  expired: "Expired",
  pending: "Pending",
  revoked: "Revoked",
};

const colorMap: Record<LicenseStatus, "default" | "success" | "error" | "warning" | "info"> = {
  active: "success",
  inactive: "info",
  expired: "error",
  pending: "warning",
  revoked: "error",
};

interface Props {
  status: LicenseStatus;
}

export function StatusChip({ status }: Props) {
  return <Chip label={labelMap[status]} color={colorMap[status]} size="small" variant="filled" />;
}

