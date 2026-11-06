import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from "@mui/material";

const searchOptions = [
  { value: "saleOutNo", label: "Mã số phiếu" },
  { value: "customerPoNo", label: "Số PO" },
  { value: "customerName", label: "Khách hàng" },
  { value: "productCode", label: "Mã sản phẩm" },
  { value: "productName", label: "Tên sản phẩm" },
  { value: "orderDate", label: "Ngày đặt hàng" },
];

function SaleOutHeader({
  searchField,
  keyword,
  fromDate,
  toDate,
  onAdd,
  onSearch,
  onOpenUpload,
  onOpenPrint,
  onDownloadTemplate,
  downloadingTemplate,
  onOpenRevenueReport,
  onSearchFieldChange,
  onKeywordChange,
  onFromDateChange,
  onToDateChange,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        width: "100%",
        p: 2,
        backgroundColor: "#fff",
        border: "1px solid #d6e3ef",
        borderRadius: 2,
        boxShadow: "0 4px 16px rgba(25, 78, 120, 0.06)",
        boxSizing: "border-box",
      }}>
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
        <FormControl size="small" fullWidth sx={{ minWidth: 0 }}>
          <InputLabel id="sale-out-search-label">Tìm theo</InputLabel>
          <Select
            labelId="sale-out-search-label"
            label="Tìm theo"
            value={searchField}
            onChange={(event) => onSearchFieldChange(event.target.value)}>
            {searchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {searchField === "orderDate" ? (
          <>
            <TextField
              size="small"
              type="date"
              label="Từ ngày"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              sx={{ minWidth: 0 }}
            />
            <TextField
              size="small"
              type="date"
              label="Đến ngày"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
              sx={{ minWidth: 0 }}
            />
          </>
        ) : (
          <TextField
            size="small"
            label="Từ khóa"
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            fullWidth
            sx={{ minWidth: 0, gridColumn: { lg: "span 2" } }}
          />
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={onSearch}
          sx={{ minHeight: 40 }}>
          Tìm kiếm
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
        }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={onAdd}
          sx={{ minHeight: 40 }}>
          Thêm mới
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onDownloadTemplate}
          disabled={downloadingTemplate}
          sx={{ minHeight: 40 }}>
          {downloadingTemplate ? "Đang tải…" : "Tải file mẫu"}
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onOpenUpload}
          sx={{ minHeight: 40 }}>
          Upload dữ liệu
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onOpenPrint}
          sx={{ minHeight: 40 }}>
          In phiếu
        </Button>

        <Button
          variant="outlined"
          fullWidth
          onClick={onOpenRevenueReport}
          sx={{ minHeight: 40 }}>
          Báo cáo doanh thu
        </Button>

        
      </Box>
    </Box>
  );
}

export default SaleOutHeader;
