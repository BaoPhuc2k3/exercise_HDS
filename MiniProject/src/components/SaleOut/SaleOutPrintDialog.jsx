import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { getSaleOutPrintOptions } from "../../api/saleOutApi";

function SaleOutPrintDialog({ onClose, onExport }) {
  const [numbers, setNumbers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getSaleOutPrintOptions()
      .then((data) => {
        if (active) setNumbers(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleExport = async () => {
    if (!selected || exporting) return;

    setExporting(true);
    setError("");

    try {
      await onExport(selected);
    } catch (exportError) {
      setError(
        exportError instanceof Error
          ? exportError.message
          : "Không thể xuất PDF.",
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
      <DialogTitle>In phiếu Xuất hàng</DialogTitle>

      <DialogContent sx={{ pt: "16px !important" }}>
        <Autocomplete
          options={numbers}
          value={selected}
          onChange={(_, value) => setSelected(value)}
          loading={loading}
          disabled={exporting}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Mã số phiếu"
              placeholder="Chọn mã phiếu"
            />
          )}
        />

        {!loading && numbers.length === 0 && !error && (
          <Typography sx={{ mt: 2 }}>Chưa có phiếu để in.</Typography>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={exporting}>
          Hủy
        </Button>

        <Button
          variant="contained"
          onClick={handleExport}
          disabled={!selected || loading || exporting}>
          {exporting ? "Đang xuất…" : "Xuất dữ liệu"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SaleOutPrintDialog;
