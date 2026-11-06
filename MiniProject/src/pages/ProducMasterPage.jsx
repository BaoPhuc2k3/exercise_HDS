import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Container, Typography } from "@mui/material";
import ProductHeader from "../components/ProductMaster/ProductHeader";
import ProductPagination from "../components/common/ListPagination";
import ProductTable from "../components/ProductMaster/ProductTable";
import ProductUploadDialog from "../components/ProductMaster/ProductUploadDialog";
import ProductFormDialog from "../components/ProductMaster/ProductFormDialog";
import { confirmDeleteProduct, showError, showSuccess } from "../utils/productAlerts";
import { getProducts, createProduct, updateProduct, deleteProduct, downloadProductTemplate, importProducts } from "../api/productsApi";

function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchField, setSearchField] = useState("productCode");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [appliedSearch, setAppliedSearch] = useState({ searchField: "productCode", keyword: "" });
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  // const [deletingProduct, setDeletingProduct] = useState(null);
  const activeRequest = useRef(null);

  const loadProducts = useCallback(async ({ searchField, keyword }) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");

    try {
      const data = await getProducts({ searchField, keyword, signal: controller.signal });
      if (controller.signal.aborted) return;
      setProducts(data);
      setPage(1);
    } catch (requestError) {
      if (controller.signal.aborted) return;
      setProducts([]);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tải dữ liệu sản phẩm.",
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    // Hoãn tải tới microtask; cleanup có thể hủy lần chạy effect trước khi request bắt đầu.
    queueMicrotask(() => {
      if (isActive) loadProducts({ searchField: "productCode", keyword: "" });
    });

    return () => {
      isActive = false;
      activeRequest.current?.abort();
    };
  }, [loadProducts]);

  const handleSearch = () => {
    const criteria = { searchField, keyword: keyword.trim() };
    setAppliedSearch(criteria);
    loadProducts(criteria);
  };

  const startIndex = (page - 1) * pageSize;
  const currentProducts = products.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleAdd = () => {
    setCreateOpen(true);
  };

  const handleCreateProduct = async (product) => {
    await createProduct(product);

    setCreateOpen(false);
    setSearchField("productCode");
    setKeyword("");

    const noFilter = {
      searchField: "productCode",
      keyword: "",
    };

    setAppliedSearch(noFilter);
    await loadProducts(noFilter);
    showSuccess("Đã thêm sản phẩm.");
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await downloadProductTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "ProductTemplate.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch {
      showError("Không thể tải file mẫu. Vui lòng thử lại.");
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

  const handleImportProducts = async (file) => {
    const result = await importProducts(file);

    handleCloseUpload();
    setSearchField("productCode");
    setKeyword("");

    const noFilter = {
      searchField: "productCode",
      keyword: "",
    };

    setAppliedSearch(noFilter);
    await loadProducts(noFilter);
    showSuccess(`Đã tải lên ${result.importedCount} sản phẩm.`);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = async (changes) => {
    if (!editingProduct) return;

    await updateProduct(editingProduct.id, changes);

    setEditingProduct(null);
    setSearchField("productCode");
    setKeyword("");

    const noFilter = {
      searchField: "productCode",
      keyword: "",
    };

    setAppliedSearch(noFilter);
    await loadProducts(noFilter);
    showSuccess("Đã cập nhật sản phẩm.");
  };

  const handleDelete = async (product) => {
    const confirmed = await confirmDeleteProduct(product, () =>
      deleteProduct(product.id),
    );

    if (!confirmed) return;

    await loadProducts(appliedSearch);
    showSuccess("Đã xóa sản phẩm.");
  };

  return (
    <Container maxWidth={false} sx={{ mt: 2, pb: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box
        sx={{
          width: "100%",
        }}>
        <ProductHeader
          searchField={searchField}
          keyword={keyword}
          onSearchFieldChange={setSearchField}
          onKeywordChange={setKeyword}
          onSearch={handleSearch}
          onAdd={handleAdd}
          onDownloadTemplate={handleDownloadTemplate}
          onOpenUpload={handleOpenUpload}
        />

        {loading && (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography>Đang tải dữ liệu…</Typography>
          </Box>
        )}

        {!loading && error && (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => loadProducts(appliedSearch)}>
                Thử lại
              </Button>
            }
            sx={{ my: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && (
          <>
            <ProductPagination
              page={page}
              pageSize={pageSize}
              totalItems={products.length}
              onPageSizeChange={handlePageSizeChange}
              showPageSize
              showPager={false}
            />

            <ProductTable
              products={currentProducts}
              startIndex={startIndex}
              emptyMessage={
                appliedSearch.keyword
                  ? "Không tìm thấy sản phẩm"
                  : "Chưa có dữ liệu"
              }
              onEdit={handleEdit}
              onDelete={handleDelete}
            />

            <ProductPagination
              page={page}
              pageSize={pageSize}
              totalItems={products.length}
              onPageChange={setPage}
              showPageSize={false}
              showPager
            />
          </>
        )}

        {createOpen && (
          <ProductFormDialog
            onClose={() => setCreateOpen(false)}
            onSave={handleCreateProduct}
          />
        )}

        {editingProduct && (
          <ProductFormDialog
            key={editingProduct.id}
            initialProduct={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSave={handleUpdateProduct}
          />
        )}
        {uploadOpen && (
          <ProductUploadDialog
            file={selectedUploadFile}
            onSelectFile={setSelectedUploadFile}
            onClose={handleCloseUpload}
            onUpload={handleImportProducts}
          />
        )}
      </Box>
    </Container>
  );
}

export default ProductMaster;
