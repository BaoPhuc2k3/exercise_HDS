import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

function SaleOutRevenueReportDialog({ onClose, onExport }) {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    if (!fromDate || !toDate) {
      setError("Vui lòng chọn Từ ngày và Đến ngày.");
      return;
    }

    if (fromDate > toDate) {
      setError("Từ ngày không được lớn hơn Đến ngày.");
      return;
    }

    setError("");
    setExporting(true);

    try {
      // Input type=date có giá trị yyyy-MM-dd.
      // API hiện nhận ngày dạng yyyyMMdd.
      await onExport(fromDate.replaceAll("-", ""), toDate.replaceAll("-", ""));

      onClose();
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Không thể xuất báo cáo.",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open
      onClose={exporting ? undefined : onClose}
      fullWidth
      maxWidth="sm">
      <DialogTitle>Báo cáo doanh thu</DialogTitle>

      <DialogContent sx={{ pt: "16px !important" }}>
        <Stack spacing={2}>
          <TextField
            type="date"
            label="Từ ngày"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            disabled={exporting}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          <TextField
            type="date"
            label="Đến ngày"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            disabled={exporting}
            slotProps={{ inputLabel: { shrink: true } }}
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Hủy
        </Button>

        <Button variant="contained" onClick={handleExport} disabled={exporting}>
          {exporting ? "Đang xuất…" : "Xuất báo cáo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaleOutRevenueReportDialog;
