import { Box, Button, MenuItem, Select, TextField } from "@mui/material";

function ProductHeader({
  searchField,
  keyword,
  onSearchFieldChange,
  onKeywordChange,
  onSearch,
  onAdd,
  onDownloadTemplate,
  onOpenUpload,
}) {
  const searchFields = [
    {
      value: "productCode",
      label: "Mã sản phẩm",
    },
    {
      value: "productName",
      label: "Tên sản phẩm",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",

        // Mobile: 1 cột
        // Tablet: 2 cột
        // Desktop: 4 cột
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },

        gap: 2,
        width: "100%",
        p: 2,
        backgroundColor: "#fff",
        border: "1px solid #d6e3ef",
        borderRadius: 2,
        boxShadow: "0 4px 16px rgba(25, 78, 120, 0.06)",
        boxSizing: "border-box",
      }}>
      {/* Select trường tìm kiếm */}
      <Select
        size="small"
        value={searchField}
        onChange={(event) => onSearchFieldChange(event.target.value)}
        sx={{
          width: "100%",
          gridColumn: {
            xs: "1 / -1",
            sm: "1 / 2",
            lg: "1 / 2",
          },
        }}>
        {searchFields.map((field) => (
          <MenuItem key={field.value} value={field.value} disabled={field.disabled}>
            {field.label}
          </MenuItem>
        ))}
      </Select>

      {/* Ô nhập từ khóa */}
      <TextField
        size="small"
        label="Từ khóa"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        sx={{
          width: "100%",
          minWidth: 0,
          gridColumn: {
            xs: "1 / -1",
            sm: "2 / 3",
            lg: "2 / 4",
          },
        }}
      />

      {/* Nút tìm kiếm */}
      <Button
        variant="contained"
        onClick={onSearch}
        sx={{
          minHeight: 40,
          gridColumn: {
            xs: "1 / -1",
            sm: "1 / -1",
            lg: "4 / 5",
          },
        }}>
        Tìm kiếm
      </Button>

      {/* Nút thêm mới */}
      <Button
        variant="outlined"
        onClick={onAdd}
        sx={{
          minHeight: 40,
          gridColumn: {
            xs: "1 / -1",
            sm: "1 / 2",
            lg: "1 / 2",
          },
        }}>
        Thêm mới
      </Button>

      {/* Tải file mẫu trống để nhập sản phẩm */}
      <Button
        variant="outlined"
        onClick={onDownloadTemplate}
        sx={{
          minHeight: 40,
          gridColumn: {
            xs: "1 / -1",
            sm: "2 / 3",
            lg: "2 / 3",
          },
        }}>
        Tải file mẫu
      </Button>

      {/* Nút upload file */}
      <Button
        variant="outlined"
        onClick={onOpenUpload}
        sx={{
          minHeight: 40,
          gridColumn: {
            xs: "1 / -1",
            sm: "1 / -1",
            lg: "3 / 4",
          },
        }}>
        Upload dữ liệu
      </Button>
    </Box>
  );
}

export default ProductHeader;
