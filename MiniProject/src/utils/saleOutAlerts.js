import Swal from "sweetalert2";

export async function confirmDeleteSaleOut(row, onConfirm) {
  const result = await Swal.fire({
    title: "Xác nhận xóa dòng Xuất hàng",
    text: `Phiếu ${row.saleOutNo ?? "—"}, PO ${row.customerPoNo ?? "—"}: xóa ${row.productCode ?? "—"} - ${row.productName ?? "—"}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Xóa",
    cancelButtonText: "Hủy",
    confirmButtonColor: "#d32f2f",
    showLoaderOnConfirm: true,
    allowOutsideClick: () => !Swal.isLoading(),
    allowEscapeKey: () => !Swal.isLoading(),
    preConfirm: async () => {
      try {
        await onConfirm();
      } catch (error) {
        Swal.showValidationMessage(
          error instanceof Error ? error.message : "Không thể xóa dòng Xuất hàng.",
        );
        return false;
      }
    },
  });

  return result.isConfirmed;
}
