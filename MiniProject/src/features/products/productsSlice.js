import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getProducts } from "../../api/productsApi";

const initialSearch = {
  searchField: "productCode",
  keyword: "",
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (criteria, { signal }) => {
    return getProducts({
      ...criteria,
      signal,
    });
  },
);

const productsSlice = createSlice({
  name: "products",

  initialState: {
    items: [],
    status: "idle",
    error: "",
    currentRequestId: null,

    draftSearch: { ...initialSearch },
    appliedSearch: { ...initialSearch },

    page: 1,
    pageSize: 20,
  },

  reducers: {
    setProductSearchField(state, action) {
      state.draftSearch.searchField = action.payload;
    },

    setProductKeyword(state, action) {
      state.draftSearch.keyword = action.payload;
    },

    applyProductSearch(state) {
      state.appliedSearch = {
        searchField: state.draftSearch.searchField,
        keyword: state.draftSearch.keyword.trim(),
      };
      state.page = 1;
    },

    resetProductSearch(state) {
      state.draftSearch = { ...initialSearch };
      state.appliedSearch = { ...initialSearch };
      state.page = 1;
    },

    setProductPage(state, action) {
      state.page = action.payload;
    },

    setProductPageSize(state, action) {
      state.pageSize = action.payload;
      state.page = 1;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        state.status = "loading";
        state.error = "";
        state.currentRequestId = action.meta.requestId;
      })

      .addCase(fetchProducts.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;

        state.items = action.payload;
        state.status = "succeeded";
        state.error = "";
        state.currentRequestId = null;

        const totalPages = Math.max(
          1,
          Math.ceil(state.items.length / state.pageSize),
        );
        state.page = Math.min(state.page, totalPages);
      })

      .addCase(fetchProducts.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;

        state.currentRequestId = null;

        if (action.meta.aborted) {
          state.status = "idle";
          return;
        }

        state.items = [];
        state.status = "failed";
        state.error = action.error.message ?? "Không thể tải dữ liệu sản phẩm.";
      });
  },
});

export const {
  setProductSearchField,
  setProductKeyword,
  applyProductSearch,
  resetProductSearch,
  setProductPage,
  setProductPageSize,
} = productsSlice.actions;

export default productsSlice.reducer;
