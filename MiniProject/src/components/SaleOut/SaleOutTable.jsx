import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function formatOrderDate(value) {
  if (value == null) return "—";
  const text = String(value);
  return /^\d{8}$/.test(text)
    ? `${text.slice(6, 8)}/${text.slice(4, 6)}/${text.slice(0, 4)}`
    : text;
}

function formatNumber(value) {
  return value == null
    ? "—"
    : Number(value).toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

const fields = [
  { label: "Mã số phiếu", width: "9%", value: (row) => row.saleOutNo || "—" },
  { label: "Số PO", width: "7%", value: (row) => row.customerPoNo || "—" },
  { label: "Ngày đặt hàng", width: "7%", value: (row) => formatOrderDate(row.orderDate) },
  { label: "Khách hàng", width: "8%", value: (row) => row.customerName || "—" },
  { label: "Mã sản phẩm", width: "7%", value: (row) => row.productCode || "—" },
  { label: "Tên sản phẩm", width: "10%", value: (row) => row.productName || "—" },
  { label: "Đơn vị tính", width: "5%", value: (row) => row.unit || "—" },
  { label: "Số lượng", width: "6%", value: (row) => formatNumber(row.quantity) },
  { label: "Số lượng/thùng", width: "7%", value: (row) => formatNumber(row.quantityPerBox) },
  { label: "Số thùng", width: "6%", value: (row) => formatNumber(row.boxQuantity) },
  { label: "Đơn giá", width: "8%", value: (row) => formatNumber(row.price) },
  { label: "Thành tiền", width: "11%", value: (row) => formatNumber(row.amount) },
];

function RowActions({ saleOut, onEdit, onDelete }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", gap: 0.25 }}>
      <Tooltip title="Sửa">
        <IconButton
          size="small"
          color="primary"
          aria-label={`Sửa ${saleOut.productCode || "sản phẩm"} của phiếu ${saleOut.saleOutNo || "Xuất hàng"}`}
          onClick={() => onEdit(saleOut)}
          sx={{ p: 0.25 }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Xóa">
        <IconButton
          size="small"
          color="error"
          aria-label={`Xóa ${saleOut.productCode || "sản phẩm"} của phiếu ${saleOut.saleOutNo || "Xuất hàng"}`}
          onClick={() => onDelete(saleOut)}
          sx={{ p: 0.25 }}>
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function SaleOutTable({
  saleOuts = [],
  startIndex = 0,
  emptyMessage = "Chưa có dữ liệu",
  onEdit,
  onDelete,
}) {
  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          display: { xs: "none", lg: "block" },
          width: "100%",
          overflowX: "hidden",
          border: "1px solid #d6e3ef",
          borderRadius: 2,
          boxShadow: "0 4px 16px rgba(25, 78, 120, 0.06)",
        }}
      >
        <Table
          sx={{
            width: "100%",
            tableLayout: "fixed",
            "& .MuiTableCell-root": {
              px: 0.5,
              py: 1,
              fontSize: "0.75rem",
              overflowWrap: "anywhere",
              verticalAlign: "middle",
            },
          }}
        >
          <colgroup>
            <col style={{ width: "3%" }} />
            <col style={{ width: "6%" }} />
            {fields.map((field) => (
              <col key={field.label} style={{ width: field.width }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: "#d9e9f7",
                "& .MuiTableCell-root": {
                  color: "#173b59",
                  borderBottomColor: "#c9ddeb",
                },
              }}
            >
              <TableCell align="center"><strong>STT</strong></TableCell>
              <TableCell align="center"><strong>Action</strong></TableCell>
              {fields.map((field) => (
                <TableCell key={field.label} align="center">
                  <strong>{field.label}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {saleOuts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={fields.length + 2} align="center" sx={{ py: 5 }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              saleOuts.map((saleOut, index) => (
                <TableRow key={saleOut.id ?? startIndex + index} hover>
                  <TableCell align="center">{startIndex + index + 1}</TableCell>
                  <TableCell align="center"><RowActions saleOut={saleOut} onEdit={onEdit} onDelete={onDelete} /></TableCell>
                  {fields.map((field) => (
                    <TableCell key={field.label} align="center">
                      {field.value(saleOut)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: { xs: "grid", lg: "none" }, gap: 2 }}>
        {saleOuts.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>{emptyMessage}</Paper>
        ) : (
          saleOuts.map((saleOut, index) => (
            <Paper
              component="article"
              key={saleOut.id ?? startIndex + index}
              sx={{ p: 2, border: "1px solid #d6e3ef", borderRadius: 2 }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography fontWeight={700}>STT {startIndex + index + 1}</Typography>
                <RowActions saleOut={saleOut} onEdit={onEdit} onDelete={onDelete} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
                {fields.map((field) => (
                  <Box key={field.label} sx={{ minWidth: 0, textAlign: "center" }}>
                    <Typography variant="caption" color="text.secondary">{field.label}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, overflowWrap: "anywhere" }}>
                      {field.value(saleOut)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          ))
        )}
      </Box>
    </>
  );
}

export default SaleOutTable;
