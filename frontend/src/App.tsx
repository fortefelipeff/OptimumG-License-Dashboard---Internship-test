import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Container, Snackbar, Typography } from "@mui/material";
import { LicenseTable } from "./components/LicenseTable";
import { LicenseDetails } from "./components/LicenseDetails";
import type { License } from "./types";
import {
  activateLicense,
  deactivateLicense,
  fetchLicense,
  fetchLicenseStatus,
  fetchLicenses,
} from "./api/licenseService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function useSelectedLicense(initial?: string | null) {
  const [selectedKey, setSelectedKey] = useState<string | null>(initial ?? null);
  const queryClient = useQueryClient();

  const license = useQuery({
    queryKey: ["license", selectedKey],
    queryFn: () => (selectedKey ? fetchLicense(selectedKey) : Promise.resolve(null)),
    enabled: Boolean(selectedKey),
  });

  const status = useQuery({
    queryKey: ["license-status", selectedKey],
    queryFn: () => (selectedKey ? fetchLicenseStatus(selectedKey) : Promise.resolve(null)),
    enabled: Boolean(selectedKey),
    refetchInterval: 30_000,
  });

  const setLicense = (item: License) => {
    setSelectedKey(item.key);
    queryClient.setQueryData(["license", item.key], item);
  };

  return {
    selectedKey,
    setLicense,
    license: license.data ?? null,
    status: status.data ?? undefined,
  };
}

function App() {
  const [snackbar, setSnackbar] = useState<{ message: string; severity: "success" | "error" } | null>(null);
  const queryClient = useQueryClient();

  const licensesQuery = useQuery({
    queryKey: ["licenses"],
    queryFn: fetchLicenses,
    staleTime: 30_000,
  });

  const { selectedKey, setLicense, license, status } = useSelectedLicense();

  useEffect(() => {
    if (!selectedKey && licensesQuery.data?.length) {
      setLicense(licensesQuery.data[0]);
    }
  }, [licensesQuery.data, selectedKey, setLicense]);

  const activateMutation = useMutation({
    mutationFn: (payload: { licenseKey: string; machineId: string; activatedBy: string }) =>
      activateLicense(payload.licenseKey, payload.machineId, payload.activatedBy),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.setQueryData(["license", data.key], data);
      setSnackbar({ message: "License activated successfully", severity: "success" });
    },
    onError: () => setSnackbar({ message: "Failed to activate license", severity: "error" }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (payload: { licenseKey: string; machineId: string }) =>
      deactivateLicense(payload.licenseKey, payload.machineId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["licenses"] });
      queryClient.setQueryData(["license", data.key], data);
      setSnackbar({ message: "Machine deactivated", severity: "success" });
    },
    onError: () => setSnackbar({ message: "Failed to deactivate machine", severity: "error" }),
  });

  const handleActivate = async ({ machineId, activatedBy }: { machineId: string; activatedBy: string }) => {
    if (!selectedKey) return;
    activateMutation.mutate({ licenseKey: selectedKey, machineId, activatedBy });
  };

  const handleDeactivate = async (machineId: string) => {
    if (!selectedKey) return;
    deactivateMutation.mutate({ licenseKey: selectedKey, machineId });
  };

  const currentLicense = useMemo(() => {
    if (!selectedKey) return null;
    if (license) return license;
    const fromList = licensesQuery.data?.find((item) => item.key === selectedKey) ?? null;
    return fromList;
  }, [license, licensesQuery.data, selectedKey]);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 3 }}>
          License Management Dashboard
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1.6fr" },
            height: { xs: "auto", md: "75vh" },
          }}
        >
          <Box sx={{ height: { xs: "auto", md: "100%" } }}>
            <LicenseTable
              licenses={licensesQuery.data}
              selectedKey={selectedKey}
              onSelect={setLicense}
              isLoading={licensesQuery.isFetching}
            />
          </Box>
          <Box sx={{ height: { xs: "auto", md: "100%" } }}>
            <LicenseDetails
              license={currentLicense}
              status={status}
              onActivate={handleActivate}
              onDeactivate={handleDeactivate}
              isActivating={activateMutation.isPending}
              isDeactivating={deactivateMutation.isPending}
            />
          </Box>
        </Box>
      </Container>

      {snackbar && (
        <Snackbar
          open
          autoHideDuration={4000}
          onClose={() => setSnackbar(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}

export default App;

