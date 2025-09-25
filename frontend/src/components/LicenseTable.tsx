import {
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { StatusChip } from "./StatusChip";
import type { License } from "../types";

interface Props {
  licenses: License[] | undefined;
  selectedKey: string | null;
  onSelect: (license: License) => void;
  isLoading: boolean;
}

export function LicenseTable({ licenses, selectedKey, onSelect, isLoading }: Props) {
  return (
    <Paper elevation={1} sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", alignItems: "center" }}>
        <Typography variant="h6">Licenses</Typography>
        {isLoading && <CircularProgress size={20} sx={{ ml: 1 }} />}
      </Box>
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Owner</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Remaining Days</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {licenses?.map((license) => {
              const isSelected = license.key === selectedKey;
              return (
                <TableRow
                  key={license.key}
                  hover
                  selected={isSelected}
                  onClick={() => onSelect(license)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>{license.key}</TableCell>
                  <TableCell>{license.productName}</TableCell>
                  <TableCell>{license.ownerName}</TableCell>
                  <TableCell>
                    <StatusChip status={license.status} />
                  </TableCell>
                  <TableCell align="right">{license.remainingDays}</TableCell>
                </TableRow>
              );
            })}
            {!licenses?.length && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No licenses available.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

