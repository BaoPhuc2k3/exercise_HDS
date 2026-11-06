import { useState } from "react";
import {
    Alert,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";

const textFields = [
    {name: "productCode", label: "Mã sản phẩm", maxLength: 50},
    {name: "productName", label: "Tên sản phẩm", maxLength: 200},
    {name: "unit", label: "Đơn vị tính", maxLength: 50},
    {name: "specification", label: "Quy cách", maxLength: 200},
];

function getInitialForm(product) {
  return {
    productCode: product?.productCode ?? "",
    productName: product?.productName ?? "",
    unit: product?.unit ?? "",
    specification: product?.specification ?? "",
    QuantityPerBox:
      product?.quantityPerBox != null ? String(product.quantityPerBox) : "",
    ProductWeight:
      product?.productWeight != null ? String(product.productWeight) : "",
  };
}

function ProductFormDialog({onClose, onSave, initialProduct = null}) {
    const isEdit = initialProduct !== null;
    const [form, setForm] = useState(getInitialForm(initialProduct));
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);


    const handleChange = (event) => {
        const {name, value} = event.target;
        setForm((current) => ({
            ...current,
            [name]: value,
        }));
        setError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (saving) return;

        for (const field of textFields) {
            const value = form[field.name]?.trim();

            if(!value){
                setError(`${field.label} không được để trống.`);
                return;
            }

            if (value.length > field.maxLength) {
                setError(`${field.label} không được vượt quá ${field.maxLength} ký tự.`);
                return;
            }
        }

        const quantityText = form.QuantityPerBox.trim();
        const quantity = Number(quantityText);

        if (
          !/^[1-9]\d*$/.test(quantityText) ||
          !Number.isSafeInteger(quantity) ||
          quantity > 2147483647
        ) {
          setError(
            "Số lượng sản phẩm trong 1 thùng phải là số nguyên dương hợp lệ và không vượt quá 2,147,483,647.",
          );
          return;
        }

        const weightText = form.ProductWeight.trim().replace(",", ".");
        const weight = Number(weightText);

        if (
          !/^(?:0|[1-9]\d*)(?:\.\d{1,3})?$/.test(weightText) ||
          !Number.isFinite(weight) ||
          weight <= 0
        ) {
          setError(
            "Trọng lượng phải lớn hơn 0 và có tối đa 3 chữ số thập phân.",
          );
          return;
        }

        const payload = {
          productName: form.productName.trim(),
          unit: form.unit.trim(),
          specification: form.specification.trim(),
          QuantityPerBox: quantity,
          ProductWeight: weight,
        };

        if (!isEdit) {
          payload.productCode = form.productCode.trim();
        }

        setSaving(true);
        setError("");

        try {
          await onSave(payload);
        } catch (saveError) {
          setError(
            saveError instanceof Error
              ? saveError.message
               : isEdit
                    ? "Đã xảy ra lỗi khi sửa sản phẩm."
                    : "Đã xảy ra lỗi khi tạo sản phẩm.",
          );
        } finally {
          setSaving(false);
        }
    };

    return (
      <Dialog
        open
        onClose={saving ? undefined : onClose}
        fullWidth
        maxWidth="md">
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>
            {isEdit ? "Chỉnh sửa sản phẩm" : "Tạo sản phẩm mới"}
          </DialogTitle>

          <DialogContent
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
              pt: "16px !important",
            }}>
            {error && (
              <Alert severity="error" sx={{ gridColumn: "1 / -1" }}>
                {error}
              </Alert>
            )}

            {textFields.map((field) => (
              <Box key={field.name} sx={{ minWidth: 0 }}>
                <Typography
                  component="label"
                  htmlFor={field.name}
                  variant="body2"
                  sx={{ display: "block", mb: 0.75, fontWeight: 500 }}>
                  {field.label}{" "}
                  <Box component="span" sx={{ color: "error.main" }}>
                    *
                  </Box>
                </Typography>
                <TextField
                  id={field.name}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  disabled={saving || (isEdit && field.name === "productCode")}
                  fullWidth
                  required
                  slotProps={{ htmlInput: { maxLength: field.maxLength } }}
                />
              </Box>
            ))}
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="label"
                htmlFor="QuantityPerBox"
                variant="body2"
                sx={{ display: "block", mb: 0.75, fontWeight: 500 }}>
                Số lượng / thùng{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <TextField
                id="QuantityPerBox"
                name="QuantityPerBox"
                value={form.QuantityPerBox}
                onChange={handleChange}
                disabled={saving}
                fullWidth
                required
                slotProps={{ htmlInput: { inputMode: "numeric" } }}
              />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                component="label"
                htmlFor="ProductWeight"
                variant="body2"
                sx={{ display: "block", mb: 0.75, fontWeight: 500 }}>
                Trọng lượng{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <TextField
                id="ProductWeight"
                name="ProductWeight"
                value={form.ProductWeight}
                onChange={handleChange}
                disabled={saving}
                fullWidth
                required
                slotProps={{ htmlInput: { inputMode: "decimal" } }}
              />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button onClick={onClose} disabled={saving}>
              Hủy
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Đang lưu…" : "Lưu"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    );
}

export default ProductFormDialog;

