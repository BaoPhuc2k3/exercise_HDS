import {  useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchSaleOuts,
  setSaleOutSearchField,
  setSaleOutKeyword,
  setSaleOutFromDate,
  setSaleOutToDate,
  applySaleOutSearch,
  resetSaleOutSearch,
  showCreatedSaleOut,
  setSaleOutPage,
  setSaleOutPageSize,
  replaceSaleOut,
  removeSaleOut,
} from "../features/saleOut/saleOutSlice";
import { Alert, Box, Button, Container, Typography } from "@mui/material";
import SaleOutHeader from "../components/SaleOut/SaleOutHeader";
import SaleOutPagination from "../components/SaleOut/SaleOutPagination";
import SaleOutTable from "../components/SaleOut/SaleOutTable";
import SaleOutCreateDialog from "../components/SaleOut/SaleOutCreateDialog";
import SaleOutUploadDialog from "../components/SaleOut/SaleOutUploadDialog";
import SaleOutEditDialog from "../components/SaleOut/SaleOutEditDialog";
import SaleOutPrintDialog from "../components/SaleOut/SaleOutPrintDialog";
import SaleOutRevenueReportDialog from "../components/SaleOut/SaleOutRevenueReportDialog";
import {
  createSaleOut,
  deleteSaleOut,
  importSaleOuts,
  downloadSaleOutTemplate,
  downloadRevenueReport,
  updateSaleOut,
  downloadSaleOutPdf,
} from "../api/saleOutApi";
import { confirmDeleteSaleOut } from "../utils/saleOutAlerts";


function SaleOutPage() {
  const [validationError, setValidationError] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editingSaleOut, setEditingSaleOut] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [revenueReportOpen, setRevenueReportOpen] = useState(false);

  const dispatch = useDispatch();

  const {
    items: saleOuts,
    status,
    error,
    draftSearch,
    appliedSearch,
    page,
    pageSize,
  } = useSelector((state) => state.saleOut);

  const { searchField, keyword, fromDate, toDate } = draftSearch;
  const loading = status === "idle" || status === "loading";


  useEffect(() => {
    const request = dispatch(fetchSaleOuts(appliedSearch));

    return () => {
      request.abort();
    };
  }, [dispatch, appliedSearch]);

  const handleSearch = () => {
    if (
      searchField === "orderDate" &&
      fromDate &&
      toDate &&
      fromDate > toDate
    ) {
      setValidationError("Từ ngày không được lớn hơn Đến ngày.");
      return;
    }
    setValidationError("");
    dispatch(applySaleOutSearch());
  };

  const startIndex = (page - 1) * pageSize;
  const currentSaleOuts = saleOuts.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (newPageSize) => {
    dispatch(setSaleOutPageSize(newPageSize));
  };

  const hasAppliedFilter = Boolean(
    appliedSearch.keyword || appliedSearch.fromDate || appliedSearch.toDate,
  );


  const handleCreateSaleOut = async (payload) => {
    const result = await createSaleOut(payload);

    setCreateOpen(false);
    setSuccessMessage(`Đã tạo phiếu ${result.saleOutNo}.`);
    dispatch(showCreatedSaleOut(result.saleOutNo));
  };

  const handleUpdateSaleOut = async (payload) => {
    if (!editingSaleOut) return;

    const updated = await updateSaleOut(editingSaleOut.id, payload);
    dispatch(replaceSaleOut(updated));
    setEditingSaleOut(null);
    setSuccessMessage(`Đã cập nhật sản phẩm ${updated.productCode} trong phiếu ${updated.saleOutNo}.`);
  };

  const handleDeleteSaleOut = async (row) => {
    const confirmed = await confirmDeleteSaleOut(row, () => deleteSaleOut(row.id));
    if (!confirmed) return;
    dispatch(removeSaleOut(row.id));
    setSuccessMessage(`Đã xóa sản phẩm ${row.productCode} khỏi phiếu ${row.saleOutNo}.`);
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    setDownloadError("");

    try {
      const blob = await downloadSaleOutTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "SaleOutTemplate.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (downloadFailure) {
      setDownloadError(
        downloadFailure instanceof Error
          ? downloadFailure.message
          : "Không thể tải file mẫu Sale Out.",
      );
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleOpenUpload = () => {
    setSelectedUploadFile(null);
    setUploadOpen(true);
  };

  const handleCloseUpload = () => {
    setUploadOpen(false);
    setSelectedUploadFile(null);
  };

  const handleImportSaleOuts = async (file) => {
    const result = await importSaleOuts(file);

    handleCloseUpload();

    // Hiển thị toàn bộ danh sách để người dùng thấy
    // cả các PO vừa nhập, kể cả file có nhiều PO.
    dispatch(resetSaleOutSearch());
    setSuccessMessage(
      `Đã tải lên ${result.importedCount} dòng trong ${result.voucherCount} phiếu Xuất hàng.`,
    );
  };

  const handleExportPdf = async (saleOutNo) => {
    const blob = await downloadSaleOutPdf(saleOutNo);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `PhieuXuatKho_${saleOutNo}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleExportRevenueReport = async (reportFromDate, reportToDate) => {
    const blob = await downloadRevenueReport(reportFromDate, reportToDate);

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `BaoCaoDoanhThu_${reportFromDate}_${reportToDate}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  return (
    <Container
      maxWidth={false}
      sx={{ mt: 2, pb: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box sx={{ width: "100%" }}>
        <SaleOutHeader
          searchField={searchField}
          keyword={keyword}
          fromDate={fromDate}
          toDate={toDate}
          onAdd={() => setCreateOpen(true)}
          onDownloadTemplate={handleDownloadTemplate}
          downloadingTemplate={downloadingTemplate}
          onOpenUpload={handleOpenUpload}
          onOpenPrint={() => setPrintOpen(true)}
          onOpenRevenueReport={() => setRevenueReportOpen(true)}
          onSearchFieldChange={(value) =>
            dispatch(setSaleOutSearchField(value))
          }
          onKeywordChange={(value) => dispatch(setSaleOutKeyword(value))}
          onFromDateChange={(value) => dispatch(setSaleOutFromDate(value))}
          onToDateChange={(value) => dispatch(setSaleOutToDate(value))}
          onSearch={handleSearch}
        />

        {downloadError && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            onClose={() => setDownloadError("")}>
            {downloadError}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {successMessage}
          </Alert>
        )}

        {validationError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            {validationError}
          </Alert>
        )}

        {loading && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography>Đang tải dữ liệu…</Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            sx={{ mt: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => dispatch(fetchSaleOuts(appliedSearch))}>
                Thử lại
              </Button>
            }>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <SaleOutPagination
              page={page}
              pageSize={pageSize}
              totalItems={saleOuts.length}
              onPageSizeChange={handlePageSizeChange}
              showPager={false}
            />

            <SaleOutTable
              saleOuts={currentSaleOuts}
              startIndex={startIndex}
              onEdit={(row) => setEditingSaleOut(row)}
              onDelete={handleDeleteSaleOut}
              emptyMessage={
                hasAppliedFilter ? "Không tìm thấy dữ liệu" : "Chưa có dữ liệu"
              }
            />

            <SaleOutPagination
              page={page}
              pageSize={pageSize}
              totalItems={saleOuts.length}
              onPageChange={(newPage) => dispatch(setSaleOutPage(newPage))}
              showPageSize={false}
            />
          </>
        )}

        {createOpen && (
          <SaleOutCreateDialog
            onClose={() => setCreateOpen(false)}
            onSave={handleCreateSaleOut}
          />
        )}

        {editingSaleOut && (
          <SaleOutEditDialog
            key={editingSaleOut.id}
            saleOut={editingSaleOut}
            onClose={() => setEditingSaleOut(null)}
            onSave={handleUpdateSaleOut}
          />
        )}

        {uploadOpen && (
          <SaleOutUploadDialog
            file={selectedUploadFile}
            onSelectFile={setSelectedUploadFile}
            onClose={handleCloseUpload}
            onUpload={handleImportSaleOuts}
          />
        )}

        {printOpen && (
          <SaleOutPrintDialog
            onClose={() => setPrintOpen(false)}
            onExport={handleExportPdf}
          />
        )}

        {revenueReportOpen && (
          <SaleOutRevenueReportDialog
            onClose={() => setRevenueReportOpen(false)}
            onExport={handleExportRevenueReport}
          />
        )}
      </Box>
    </Container>
  );
}

export default SaleOutPage;
