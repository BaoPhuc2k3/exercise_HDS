import { useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

function ProductUploadDialog({ file, onSelectFile, onClose, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [rowErrors, setRowErrors] = useState([]);

  const handleSubmit = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setError("");
    setRowErrors([]);

    try {
      await onUpload(file);
    } catch (uploadError) {
      setError(uploadError.message ?? "Không thể tải file lên.");
      setRowErrors(uploadError.errors ?? []);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open
      onClose={uploading ? undefined : onClose}
      fullWidth
      maxWidth="sm">
      <DialogTitle>Tải lên file sản phẩm</DialogTitle>

      <DialogContent>
        <Button component="label" variant="outlined" disabled={uploading}>
          {file ? "Chọn tệp khác" : "Chọn tệp"}
          <input
            hidden
            type="file"
            accept=".xlsx"
            onChange={(event) => {
              const nextFile = event.target.files?.[0];

              if (nextFile) {
                onSelectFile(nextFile);
                setError("");
                setRowErrors([]);
              }

              event.target.value = "";
            }}
          />
        </Button>

        <Typography sx={{ mt: 2 }}>
          {file ? (
            <>Tệp đã chọn: <strong>{file.name}</strong></>
          ) : (
            "Chưa chọn tệp"
          )}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {rowErrors.length > 0 && (
          <div style={{ maxHeight: 220, overflowY: "auto", marginTop: 12 }}>
            {rowErrors.map((item, index) => (
              <Typography key={`${item.rowNumber}-${item.field}-${index}`}>
                {item.message}
              </Typography>
            ))}
          </div>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={uploading}>
          Hủy
        </Button>

        <Button variant="contained" onClick={handleSubmit} disabled={uploading || !file}>
          {uploading ? "Đang tải lên…" : "Tải lên"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ProductUploadDialog;
