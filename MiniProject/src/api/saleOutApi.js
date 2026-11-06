import axios from "axios";
import apiClient from "./apiClient";

export async function getSaleOuts({
  searchField = "customerPoNo",
  keyword = "",
  fromDate = "",
  toDate = "",
  signal,
} = {}) {
  const hasFilter = Boolean(keyword || fromDate || toDate);

  const params = !hasFilter
    ? undefined
    : searchField === "orderDate"
      ? {
          searchField,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        }
      : { searchField, keyword };

  try {
    const response = await apiClient.get("/api/sale-outs", {
      params,
      signal,
    });

    if (!Array.isArray(response.data)) {
      throw new Error("Dữ liệu Sale Out từ API không hợp lệ.");
    }

    return response.data;
  } catch (error) {
    if (signal?.aborted) throw error;

    if (error instanceof Error && !axios.isAxiosError(error)) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message ?? "Điều kiện tìm kiếm không hợp lệ.",
          { cause: error },
        );
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", { cause: error });
      }

      throw new Error(
        `Không thể tải dữ liệu Sale Out (HTTP ${error.response.status}).`,
        { cause: error },
      );
    }

    throw new Error("Không thể tải dữ liệu Sale Out.", { cause: error });
  }
}

export async function getNextSaleOutNo(orderDate) {
  const response = await apiClient.get("/api/sale-outs/next-number", {
    params: { orderDate },
  });

  return response.data.saleOutNo;
}

export async function createSaleOut(payload) {
  try {
    const response = await apiClient.post("/api/sale-outs", payload);

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400 || error.response?.status === 409) {
        throw new Error(
          error.response.data?.message ?? "Dữ liệu phiếu không hợp lệ.",
          { cause: error },
        );
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", { cause: error });
      }
    }

    throw new Error("Không thể lưu phiếu Xuất hàng.", { cause: error });
  }
}

export async function updateSaleOut(id, payload) {
  try {
    const response = await apiClient.put(`/api/sale-outs/${id}`, payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error(
          error.response.data?.message ?? "Dữ liệu chỉnh sửa không hợp lệ.",
          { cause: error },
        );
      }
      if (error.response?.status === 404) {
        throw new Error(
          error.response.data?.message ??
            "Không tìm thấy dòng Xuất hàng cần sửa.",
          { cause: error },
        );
      }
      if (error.response?.status === 503) {
        throw new Error(
          "Backend hoặc cơ sở dữ liệu đang không sẵn sàng. Vui lòng thử lại.",
          { cause: error },
        );
      }
      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", { cause: error });
      }
    }

    throw new Error("Không thể lưu thay đổi Xuất hàng.", { cause: error });
  }
}

export async function deleteSaleOut(id) {
  try {
    await apiClient.delete(`/api/sale-outs/${id}`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Dòng Xuất hàng không còn tồn tại.", { cause: error });
      }
      if (error.response?.status === 503) {
        throw new Error(
          "Backend hoặc cơ sở dữ liệu đang không sẵn sàng. Vui lòng thử lại.",
          { cause: error },
        );
      }
      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", { cause: error });
      }
    }

    throw new Error("Không thể xóa dòng Xuất hàng.", { cause: error });
  }
}

export async function downloadSaleOutTemplate() {
  try {
    const response = await apiClient.get("/api/sale-outs/template", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error("Không thể kết nối đến backend.", { cause: error });
    }
    throw new Error("Không thể tải file mẫu Sale Out. Vui lòng thử lại.", {
      cause: error,
    });
  }
}

export async function importSaleOuts(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await apiClient.post("/api/sale-outs/import", formData, {
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data?.errors) {
      const importError = new Error("File Xuất hàng có dữ liệu không hợp lệ.");

      importError.errors = error.response.data.errors;

      throw importError;
    }

    throw new Error(
      axios.isAxiosError(error) && !error.response
        ? "Không thể kết nối đến backend."
        : "Không thể tải file Xuất hàng lên.",
      { cause: error },
    );
  }
}

export async function getSaleOutPrintOptions() {
  try {
    const response = await apiClient.get("/api/sale-outs/print-options");

    if (!Array.isArray(response.data)) {
      throw new Error("Danh sách mã phiếu không hợp lệ.");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && !error.response) {
      throw new Error("Không thể kết nối đến backend.", { cause: error });
    }

    throw new Error("Không thể tải danh sách mã phiếu.", { cause: error });
  }
}

export async function downloadSaleOutPdf(saleOutNo) {
  try {
    const response = await apiClient.get(
      `/api/sale-outs/${encodeURIComponent(saleOutNo)}/pdf`,
      {
        responseType: "blob",
        timeout: 30000,
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Phiếu đã chọn không còn tồn tại.", { cause: error });
      }

      if (error.response?.status === 409) {
        throw new Error("Dữ liệu các dòng của phiếu không thống nhất.", {
          cause: error,
        });
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", { cause: error });
      }
    }

    throw new Error("Không thể xuất PDF. Vui lòng thử lại.", { cause: error });
  }
}

export async function downloadRevenueReport(fromDate, toDate) {
  try {
    const response = await apiClient.get("/api/sale-outs/revenue-report", {
      params: { fromDate, toDate },
      responseType: "blob",
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 400) {
        throw new Error("Khoảng ngày báo cáo không hợp lệ.", {
          cause: error,
        });
      }

      if (error.response?.status === 503) {
        throw new Error("Không thể tạo báo cáo. Vui lòng thử lại sau.", {
          cause: error,
        });
      }

      if (!error.response) {
        throw new Error("Không thể kết nối đến backend.", {
          cause: error,
        });
      }
    }

    throw new Error("Không thể xuất báo cáo doanh thu.", {
      cause: error,
    });
  }
}