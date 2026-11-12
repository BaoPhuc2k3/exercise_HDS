import {
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function ProductTable({ products = [], startIndex = 0, emptyMessage = "Chưa có dữ liệu", onEdit, onDelete }) {
  return (
    <TableContainer
      component={Paper}
      sx={{
        width: "100%",
        overflowX: "auto",
        border: "1px solid #d6e3ef",
        borderRadius: 2,
        boxShadow: "0 4px 16px rgba(25, 78, 120, 0.06)",
      }}
    >
      <Table sx={{ minWidth: 1100 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#d9e9f7", "& .MuiTableCell-root": { color: "#173b59", borderBottomColor: "#c9ddeb" } }}>
            <TableCell align="center">
              <strong>STT</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Action</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Mã sản phẩm</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Tên sản phẩm</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Đơn vị tính</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Quy cách</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Số lượng/Thùng</strong>
            </TableCell>
            <TableCell align="center">
              <strong>Trọng lượng</strong>
            </TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            products.map((product, index) => (
              <TableRow key={product.id ?? index} hover>
                <TableCell align="center">{startIndex + index + 1}</TableCell>
                <TableCell align="center">
                  <Tooltip title="Chỉnh sửa">
                    <IconButton
                      color="primary"
                      onClick={() => onEdit?.(product)}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Xóa">
                    <IconButton
                      color="error"
                      onClick={() => onDelete?.(product)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">{product.productCode}</TableCell>
                <TableCell align="center">{product.productName}</TableCell>
                <TableCell align="center">{product.unit}</TableCell>
                <TableCell align="center">{product.specification}</TableCell>
                <TableCell align="center">
                  {product.quantityPerBox}
                </TableCell>
                <TableCell align="center">{product.productWeight}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ProductTable;
