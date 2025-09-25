import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { ActivationDialog } from "./ActivationDialog";
import { StatusChip } from "./StatusChip";
import type { License, LicenseStatusSummary } from "../types";

interface Props {
  license: License | null;
  status?: LicenseStatusSummary;
  onActivate: (payload: { machineId: string; activatedBy: string }) => Promise<void> | void;
  onDeactivate: (machineId: string) => Promise<void> | void;
  isActivating: boolean;
  isDeactivating: boolean;
}

function formatDate(input: string) {
  return new Date(input).toLocaleString();
}

export function LicenseDetails({
  license,
  status,
  onActivate,
  onDeactivate,
  isActivating,
  isDeactivating,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const remainingSlots = useMemo(() => {
    if (!license) return 0;
    return Math.max(license.activationLimit - license.activations.length, 0);
  }, [license]);

  if (!license) {
    return (
      <Card sx={{ height: "100%" }}>
        <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          <Typography color="text.secondary">Select a license to view details.</Typography>
        </CardContent>
      </Card>
    );
  }

  const handleActivate = async (payload: { machineId: string; activatedBy: string }) => {
    await onActivate(payload);
  };

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flex: 1, overflowY: "auto" }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <div>
            <Typography variant="h5">{license.productName}</Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {license.ownerName}
            </Typography>
          </div>
          <StatusChip status={license.status} />
        </Stack>

        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Chip label={`Tier: ${license.tier}`} size="small" />
          <Chip label={`Activations: ${license.activations.length}/${license.activationLimit}`} size="small" />
          <Chip label={`Remaining slots: ${remainingSlots}`} size="small" color={remainingSlots > 0 ? "success" : "warning"} />
          {status && <Chip label={`Days left: ${status.remainingDays}`} size="small" color={status.expired ? "error" : "info"} />}
        </Stack>

        <Stack spacing={1.5} sx={{ mt: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            License Details
          </Typography>
          <Box>
            <Typography variant="body2">
              <strong>License Key:</strong> {license.key}
            </Typography>
            <Typography variant="body2">
              <strong>Issued:</strong> {formatDate(license.issuedAt)}
            </Typography>
            <Typography variant="body2">
              <strong>Expires:</strong> {formatDate(license.expiresAt)}
            </Typography>
            {license.notes && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Notes:</strong> {license.notes}
              </Typography>
            )}
          </Box>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="subtitle1">Machine Activations</Typography>
          <Button variant="contained" onClick={() => setDialogOpen(true)} disabled={remainingSlots === 0}>
            Activate Machine
          </Button>
        </Stack>
        <List dense sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
          {license.activations.length === 0 && (
            <ListItem>
              <ListItemText primary="No machines activated yet." />
            </ListItem>
          )}
          {license.activations.map((activation) => (
            <ListItem
              key={activation.machineId}
              secondaryAction={
                <Tooltip title="Deactivate machine">
                  <span>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      disabled={isDeactivating}
                      onClick={() => onDeactivate(activation.machineId)}
                    >
                      Deactivate
                    </Button>
                  </span>
                </Tooltip>
              }
            >
              <ListItemText
                primary={`${activation.machineId} ? ${activation.activatedBy}`}
                secondary={`Activated at ${formatDate(activation.activatedAt)}`}
              />
            </ListItem>
          ))}
        </List>
      </CardContent>

      <ActivationDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleActivate}
        isLoading={isActivating}
      />
    </Card>
  );
}

