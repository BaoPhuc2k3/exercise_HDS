import axios from "axios";
import apiClient from "./apiClient";

export async function getProducts({ searchField, keyword, signal } = {}) {
  try {
    const response = await apiClient.get("/api/products", {
      params: keyword ? { searchField, keyword } : undefined,
      signal,
    });
    const products = response.data;

    if (!Array.isArray(products)) {
      throw new Error("Dữ liệu sản phẩm từ API không hợp lệ.");
    }

    return products;
  } catch (error) {
    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.response) {
        throw new Error(
          `Không thể tải dữ liệu sản phẩm (HTTP ${error.response.status}).`,
          { cause: error },
        );
      }

      throw new Error(
        "Không thể kết nối đến máy chủ. Vui lòng kiểm tra backend và thử lại.",
        { cause: error },
      );
    }

    throw new Error("Không thể tải dữ liệu sản phẩm.", { cause: error });
  }
}

export async function createProduct(product) {
  try {
    const response = await apiClient.post("/api/products", product);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      throw new Error(
        error.response.data?.message ?? "Mã sản phẩm đã tồn tại.",
        { cause: error },
      );
    }

    throw new Error("Không thể tạo sản phẩm mới.", { cause: error });
  }
}

export async function updateProduct(id, product) {
  try {
    const response = await apiClient.put(`/api/products/${id}`, product);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Không tìm thấy sản phẩm cần sửa.", { cause: error });
      }

      if (error.response?.status === 400) {
        throw new Error(
          "Dữ liệu sản phẩm không hợp lệ. Vui lòng kiểm tra lại.",
          {
            cause: error,
          },
        );
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến máy chủ.", { cause: error });
      }
    }

    throw new Error("Không thể lưu thay đổi sản phẩm.", { cause: error });
  }
}

export async function deleteProduct(id) {
  try {
    await apiClient.delete(`/api/products/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Sản phẩm không còn tồn tại.", { cause: error });
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến máy chủ.", { cause: error });
      }
    }

    throw new Error("Không thể xóa sản phẩm.", { cause: error });
  }
}

export async function downloadProductTemplate() {
  const response = await apiClient.get("/api/products/template", {
    responseType: "blob",
  });

  return response.data;
}

export async function importProducts(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post("/api/products/import", formData, {
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.errors) {
      const importError = new Error("File có dữ liệu không hợp lệ.");
      importError.errors = error.response.data.errors;
      throw importError;
    }

    throw new Error(
      axios.isAxiosError(error) && !error.response
        ? "Không thể kết nối đến backend."
        : "Không thể tải file lên.",
      { cause: error },
    );
  }
}
