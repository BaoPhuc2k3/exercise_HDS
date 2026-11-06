import { IconButton, MenuItem, TableCell, TableRow, TextField, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

function SaleOutProductRow({
  row, index, products, disabled, canRemove, onChange, onRemove,
}) {
  const quantity = Number(row.quantity);
  const perBox = Number(row.quantityPerBox);
  const price = Number(row.price);
  const boxQuantity = row.quantity && row.quantityPerBox && perBox > 0
    ? Math.ceil(quantity / perBox) : "";
  const amount = row.quantity && row.price !== ""
    ? Math.round(quantity * price * 1000) / 1000 : "";

  return (
    <TableRow hover>
      <TableCell align="center">{index + 1}</TableCell>
      <TableCell sx={{ minWidth: 230 }}>
        <TextField
          select size="small" label="Chọn sản phẩm"
          aria-label={`Mã sản phẩm dòng ${index + 1}`}
          value={row.productId} disabled={disabled}
          onChange={(event) => onChange(row.key, "productId", event.target.value)}
          fullWidth>
          {products.map((product) => (
            <MenuItem key={product.id} value={product.id}>
              {product.productCode} ({product.productName})
            </MenuItem>
          ))}
        </TextField>
      </TableCell>
      <TableCell sx={{ minWidth: 105 }}>
        <TextField size="small" aria-label={`Đơn vị tính dòng ${index + 1}`}
          value={row.unit} slotProps={{ input: { readOnly: true } }} fullWidth />
      </TableCell>
      <TableCell sx={{ minWidth: 115 }}>
        <TextField size="small" type="number"
          aria-label={`Số lượng dòng ${index + 1}`}
          value={row.quantity} disabled={disabled}
          onChange={(event) => onChange(row.key, "quantity", event.target.value)}
          slotProps={{ htmlInput: { min: "0.001", step: "0.001" } }} fullWidth />
      </TableCell>
      <TableCell sx={{ minWidth: 140 }}>
        <TextField size="small" type="number"
          aria-label={`Số lượng mỗi thùng dòng ${index + 1}`}
          value={row.quantityPerBox} disabled={disabled}
          onChange={(event) => onChange(row.key, "quantityPerBox", event.target.value)}
          slotProps={{ htmlInput: { min: "0.001", step: "0.001" } }} fullWidth />
      </TableCell>
      <TableCell sx={{ minWidth: 100 }}>
        <TextField size="small" aria-label={`Số thùng dòng ${index + 1}`}
          value={boxQuantity} slotProps={{ input: { readOnly: true } }} fullWidth />
      </TableCell>
      <TableCell sx={{ minWidth: 130 }}>
        <TextField size="small" type="number"
          aria-label={`Đơn giá dòng ${index + 1}`}
          value={row.price} disabled={disabled}
          onChange={(event) => onChange(row.key, "price", event.target.value)}
          slotProps={{ htmlInput: { min: "0", step: "0.001" } }} fullWidth />
      </TableCell>
      <TableCell sx={{ minWidth: 145 }}>
        <TextField size="small" aria-label={`Thành tiền dự kiến dòng ${index + 1}`}
          value={amount} slotProps={{ input: { readOnly: true } }} fullWidth />
      </TableCell>
      <TableCell align="center">
        <Tooltip title={canRemove ? "Xóa dòng" : "Cần ít nhất một sản phẩm"}>
          <span>
            <IconButton type="button" color="error"
              aria-label={`Xóa sản phẩm dòng ${index + 1}`}
              disabled={disabled || !canRemove}
              onClick={() => onRemove(row.key)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
}

export default SaleOutProductRow;
