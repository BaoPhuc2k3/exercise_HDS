import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { getProducts } from "../../api/productsApi";
import { getNextSaleOutNo } from "../../api/saleOutApi";
import SaleOutProductRow from "./SaleOutProductRow";

function todayLocal() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyRow() {
  return {
    key: crypto.randomUUID(),
    productId: "",
    unit: "",
    quantity: "",
    quantityPerBox: "",
    price: "",
  };
}

function validDecimal(text, allowZero = false) {
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return false;

  const number = Number(text);

  return Number.isFinite(number) && (allowZero ? number >= 0 : number > 0);
}

function SaleOutCreateDialog({ onClose, onSave }) {
  const [form, setForm] = useState({
    customerPoNo: "",
    orderDate: todayLocal(),
    customerName: "",
  });
  const [rows, setRows] = useState([emptyRow()]);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [preview, setPreview] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    getProducts({})
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) {
          setError("Không thể tải danh sách sản phẩm.");
        }
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.orderDate) return;

    let active = true;
    const dateNumber = form.orderDate.replaceAll("-", "");

    getNextSaleOutNo(dateNumber)
      .then((number) => {
        if (active) setPreview(number);
      })
      .catch(() => {
        if (active) {
          setPreviewError("Không thể lấy mã dự kiến. Vui lòng thử lại.");
        }
      });

    return () => {
      active = false;
    };
  }, [form.orderDate]);

  const changeRow = (key, field, value) => {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) return row;

        if (field === "productId") {
          const product = products.find((item) => item.id === value);

          return {
            ...row,
            productId: value,
            unit: product?.unit ?? "",
            quantityPerBox: product ? String(product.quantityPerBox) : "",
          };
        }

        return { ...row, [field]: value };
      }),
    );

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    const po = form.customerPoNo.trim();
    const customer = form.customerName.trim();

    if (!po || po.length > 50) {
      setError("Số PO khách hàng là bắt buộc, tối đa 50 ký tự.");
      return;
    }

    if (!customer || customer.length > 200) {
      setError("Khách hàng là bắt buộc, tối đa 200 ký tự.");
      return;
    }

    if (!form.orderDate) {
      setError("Ngày đặt hàng không được để trống.");
      return;
    }

    const usedProducts = new Set();

    for (const [index, row] of rows.entries()) {
      if (!row.productId) {
        setError(`Dòng ${index + 1}: Vui lòng chọn sản phẩm.`);
        return;
      }

      if (usedProducts.has(row.productId)) {
        setError(`Dòng ${index + 1}: Sản phẩm bị lặp trong phiếu.`);
        return;
      }

      usedProducts.add(row.productId);

      if (
        !validDecimal(row.quantity) ||
        !validDecimal(row.quantityPerBox) ||
        !validDecimal(row.price, true)
      ) {
        setError(
          `Dòng ${index + 1}: Kiểm tra Số lượng, ` +
            "Số lượng/Thùng và Đơn giá.",
        );
        return;
      }
    }

    const payload = {
      customerPoNo: po,
      orderDate: Number(form.orderDate.replaceAll("-", "")),
      customerName: customer,
      items: rows.map((row) => ({
        productId: row.productId,
        quantity: Number(row.quantity),
        quantityPerBox: Number(row.quantityPerBox),
        price: Number(row.price),
      })),
    };

    setSaving(true);
    setError("");

    try {
      await onSave(payload);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Không thể lưu phiếu.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xl">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Thêm mới phiếu Xuất hàng</DialogTitle>

        <DialogContent
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 2,
            pt: "16px !important",
          }}>
          {error && <Alert severity="error">{error}</Alert>}

          {previewError && <Alert severity="warning">{previewError}</Alert>}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
              gap: 2,
            }}>
            <TextField
              label="Mã số phiếu dự kiến"
              value={preview || "Đang lấy mã..."}
              slotProps={{
                input: { readOnly: true },
              }}
              fullWidth
            />

            <TextField
              label="Ngày đặt hàng *"
              type="date"
              value={form.orderDate}
              onChange={(event) => {
                setForm((current) => ({
                  ...current,
                  orderDate: event.target.value,
                }));
                setPreview("");
                setPreviewError("");
              }}
              slotProps={{
                inputLabel: { shrink: true },
              }}
              disabled={saving}
              fullWidth
            />

            <TextField
              label="Số PO khách hàng *"
              value={form.customerPoNo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customerPoNo: event.target.value,
                }))
              }
              disabled={saving}
              fullWidth
            />

            <TextField
              label="Khách hàng *"
              value={form.customerName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  customerName: event.target.value,
                }))
              }
              disabled={saving}
              fullWidth
            />
          </Box>

          <Paper variant="outlined" sx={{ minWidth: 0, overflow: "hidden", borderRadius: 2 }}>
            <Box sx={{ display: "flex", justifyContent: "flex-start", p: 1.5 }}>
              <Button
                type="button"
                variant="outlined"
                disabled={saving || productsLoading}
                onClick={() => setRows((current) => [...current, emptyRow()])}>
                Thêm sản phẩm
              </Button>
            </Box>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 1190 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#d9e9f7" }}>
                    <TableCell align="center">STT</TableCell>
                    <TableCell>Mã sản phẩm *</TableCell>
                    <TableCell>Đơn vị tính</TableCell>
                    <TableCell>Số lượng *</TableCell>
                    <TableCell>Số lượng/Thùng *</TableCell>
                    <TableCell>Số thùng</TableCell>
                    <TableCell>Đơn giá *</TableCell>
                    <TableCell>Thành tiền</TableCell>
                    <TableCell align="center">Xóa</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <SaleOutProductRow
                      key={row.key}
                      row={row}
                      index={index}
                      products={products}
                      disabled={saving || productsLoading}
                      canRemove={rows.length > 1}
                      onChange={changeRow}
                      onRemove={(key) =>
                        setRows((current) => current.filter((item) => item.key !== key))
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Hủy
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={saving || productsLoading || !preview}>
            {saving ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default SaleOutCreateDialog;
