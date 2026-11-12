import {useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  setProductSearchField,
  setProductKeyword,
  applyProductSearch,
  resetProductSearch,
  setProductPage,
  setProductPageSize,
} from "../features/products/productsSlice";
import { Alert, Box, Button, Container, Typography } from "@mui/material";
import ProductHeader from "../components/ProductMaster/ProductHeader";
import ProductPagination from "../components/common/ListPagination";
import ProductTable from "../components/ProductMaster/ProductTable";
import ProductUploadDialog from "../components/ProductMaster/ProductUploadDialog";
import ProductFormDialog from "../components/ProductMaster/ProductFormDialog";
import { confirmDeleteProduct, showError, showSuccess } from "../utils/productAlerts";
import { createProduct, updateProduct, deleteProduct, downloadProductTemplate, importProducts } from "../api/productsApi";

function ProductMaster() {
  const [createOpen, setCreateOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const dispatch = useDispatch();

  const {
    items: products,
    status,
    error,
    draftSearch,
    appliedSearch,
    page,
    pageSize,
  } = useSelector((state) => state.products);

  const { searchField, keyword } = draftSearch;
  const loading = status === "idle" || status === "loading";

  useEffect(() => {
    const request = dispatch(fetchProducts(appliedSearch));

    return () => {
      request.abort();
    };
  }, [dispatch, appliedSearch]);

  const handleSearch = () => {
    dispatch(applyProductSearch());
  };


  const startIndex = (page - 1) * pageSize;
  const currentProducts = products.slice(
    startIndex,
    startIndex + pageSize
  );

  const handlePageSizeChange = (newPageSize) => {
    dispatch(setProductPageSize(newPageSize));
  };

  const handleAdd = () => {
    setCreateOpen(true);
  };

  const handleCreateProduct = async (product) => {
    await createProduct(product);

    setCreateOpen(false);
    dispatch(resetProductSearch());
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
    dispatch(resetProductSearch());
    showSuccess(`Đã tải lên ${result.importedCount} sản phẩm.`);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
  };

  const handleUpdateProduct = async (changes) => {
    if (!editingProduct) return;

    await updateProduct(editingProduct.id, changes);

    setEditingProduct(null);
    dispatch(resetProductSearch());
    showSuccess("Đã cập nhật sản phẩm.");
  };

  const handleDelete = async (product) => {
    const confirmed = await confirmDeleteProduct(product, () =>
      deleteProduct(product.id),
    );

    if (!confirmed) return;
    dispatch(setProductPage(1));
    dispatch(resetProductSearch());
    showSuccess("Đã xóa sản phẩm.");
  };

  return (
    <Container
      maxWidth={false}
      sx={{ mt: 2, pb: 4, px: { xs: 2, sm: 3, lg: 4 } }}>
      <Box
        sx={{
          width: "100%",
        }}>
        <ProductHeader
          searchField={searchField}
          keyword={keyword}
          onSearchFieldChange={(value) =>
            dispatch(setProductSearchField(value))
          }
          onKeywordChange={(value) => dispatch(setProductKeyword(value))}
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
                onClick={() => dispatch(fetchProducts(appliedSearch))}>
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
              onPageChange={(newPage) => dispatch(setProductPage(newPage))}
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
