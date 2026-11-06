import Swal from "sweetalert2";

const successToast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
});

export function showSuccess(message) {
  return successToast.fire({
    icon: "success",
    title: message,
  });
}

export function showError(message) {
  return Swal.fire({
    icon: "error",
    title: "Không thể tải dữ liệu Excel",
    text: message,
  });
}

export async function confirmDeleteProduct(product, onConfirm) {
  const result = await Swal.fire({
    title: "Xác nhận xóa sản phẩm",
    text: `Bạn có chắc muốn xóa ${product.productCode} - ${product.productName}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#d32f2f",
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    preConfirm: async () => {
      try {
        await onConfirm();
      } catch (error) {
        Swal.showValidationMessage(
          error instanceof Error ? error.message : "Không thể xóa sản phẩm.",
        );
        return false;
      }
    },
  });

  return result.isConfirmed;
}
