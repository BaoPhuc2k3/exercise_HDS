import { useState } from "react";
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
} from "@mui/material";

function formatOrderDate(value) {
  if (value == null) return "";
  const text = String(value);
  return /^\d{8}$/.test(text)
    ? `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`
    : text;
}

function validDecimal(text, allowZero = false) {
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return false;
  const number = Number(text);
  return Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
}

function SaleOutEditDialog({ saleOut, onClose, onSave }) {
  const [form, setForm] = useState({
    quantity: String(saleOut.quantity ?? ""),
    quantityPerBox: String(saleOut.quantityPerBox ?? ""),
    price: String(saleOut.price ?? ""),
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const quantity = Number(form.quantity);
  const perBox = Number(form.quantityPerBox);
  const price = Number(form.price);
  const boxQuantity = validDecimal(form.quantity) && validDecimal(form.quantityPerBox)
    ? Math.ceil(quantity / perBox)
    : "";
  const amount = validDecimal(form.quantity) && validDecimal(form.price, true)
    ? Math.round(quantity * price * 1000) / 1000
    : "";

  const handleChange = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    if (!validDecimal(form.quantity) ||
        !validDecimal(form.quantityPerBox) ||
        !validDecimal(form.price, true)) {
      setError("Số lượng và Số lượng/Thùng phải lớn hơn 0; Đơn giá không âm. Mỗi số có tối đa 3 chữ số thập phân.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await onSave({ quantity, quantityPerBox: perBox, price });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không thể lưu thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="lg">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Chỉnh sửa dòng Xuất hàng</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "16px !important" }}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField label="Mã số phiếu" value={saleOut.saleOutNo ?? ""} disabled fullWidth />
            <TextField label="Ngày đặt hàng" value={formatOrderDate(saleOut.orderDate)} disabled fullWidth />
            <TextField label="PO khách hàng" value={saleOut.customerPoNo ?? ""} disabled fullWidth />
            <TextField label="Khách hàng" value={saleOut.customerName ?? ""} disabled fullWidth />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField label="Mã sản phẩm" value={`${saleOut.productCode ?? ""} (${saleOut.productName ?? ""})`} disabled fullWidth />
            <TextField label="Đơn vị tính" value={saleOut.unit ?? ""} disabled fullWidth />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(5, minmax(0, 1fr))" }, gap: 2 }}>
            <TextField label="Số lượng/Thùng *" type="number" value={form.quantityPerBox}
              onChange={handleChange("quantityPerBox")} disabled={saving}
              slotProps={{ htmlInput: { min: "0.001", step: "0.001" } }} fullWidth />
            <TextField label="Số lượng *" type="number" value={form.quantity}
              onChange={handleChange("quantity")} disabled={saving}
              slotProps={{ htmlInput: { min: "0.001", step: "0.001" } }} fullWidth />
            <TextField label="Đơn giá *" type="number" value={form.price}
              onChange={handleChange("price")} disabled={saving}
              slotProps={{ htmlInput: { min: "0", step: "0.001" } }} fullWidth />
            <TextField label="Số thùng" value={boxQuantity}
              slotProps={{ input: { readOnly: true } }} fullWidth />
            <TextField label="Thành tiền dự kiến" value={amount}
              slotProps={{ input: { readOnly: true } }} fullWidth />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>Hủy</Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Đang lưu…" : "Lưu"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default SaleOutEditDialog;
