import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { machineId: string; activatedBy: string }) => Promise<void> | void;
  isLoading: boolean;
}

export function ActivationDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const [machineId, setMachineId] = useState("");
  const [activatedBy, setActivatedBy] = useState("");

  const handleSubmit = async () => {
    if (!machineId.trim()) {
      return;
    }
    await onSubmit({ machineId: machineId.trim(), activatedBy: activatedBy.trim() || "unknown" });
    setMachineId("");
    setActivatedBy("");
    onClose();
  };

  const handleClose = () => {
    setMachineId("");
    setActivatedBy("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Activate Machine</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Machine ID"
            value={machineId}
            onChange={(event) => setMachineId(event.target.value)}
            required
            autoFocus
          />
          <TextField
            label="Activated By"
            value={activatedBy}
            onChange={(event) => setActivatedBy(event.target.value)}
            helperText="Optional"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading || !machineId.trim()}>
          {isLoading ? "Activating..." : "Activate"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

