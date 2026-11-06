import { Box, Button, FormControl, MenuItem, Select, Typography } from "@mui/material";

function ListPagination({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  showPager = true,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: showPageSize && showPager
          ? "space-between"
          : showPageSize ? "flex-start" : "flex-end",
        gap: 2,
        flexWrap: "wrap",
        py: 2,
      }}
    >
      {showPageSize && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <Typography>Hiển thị</Typography>
          <FormControl size="small" sx={{ minWidth: 78 }}>
            <Select
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              inputProps={{ "aria-label": "Số bản ghi mỗi trang" }}
            >
              {[10, 20, 50, 100].map((size) => (
                <MenuItem key={size} value={size}>{size}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography>bản ghi trên mỗi trang</Typography>
        </Box>
      )}

      {showPager && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Button variant="text" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            |&lt; Previous
          </Button>
          <Typography>{page}/{totalPages}</Typography>
          <Typography>Page</Typography>
          <Button variant="text" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next &gt;|
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default ListPagination;
