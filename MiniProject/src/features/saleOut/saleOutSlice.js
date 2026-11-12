import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getSaleOuts } from "../../api/saleOutApi";

const initialSearch = {
  searchField: "customerPoNo",
  keyword: "",
};

const initialDraft = {
  ...initialSearch,
  fromDate: "",
  toDate: "",
};

export const fetchSaleOuts = createAsyncThunk(
  "saleOut/fetchSaleOuts",
  async (criteria, { signal }) => {
    return getSaleOuts({
      ...criteria,
      signal,
    });
  },
);

const saleOutSlice = createSlice({
  name: "saleOut",

  initialState: {
    items: [],
    status: "idle",
    error: "",
    currentRequestId: null,

    draftSearch: { ...initialDraft },
    appliedSearch: { ...initialSearch },

    page: 1,
    pageSize: 20,
  },

  reducers: {
    setSaleOutSearchField(state, action) {
      state.draftSearch.searchField = action.payload;
    },

    setSaleOutKeyword(state, action) {
      state.draftSearch.keyword = action.payload;
    },

    setSaleOutFromDate(state, action) {
      state.draftSearch.fromDate = action.payload;
    },

    setSaleOutToDate(state, action) {
      state.draftSearch.toDate = action.payload;
    },

    applySaleOutSearch(state) {
      const draft = state.draftSearch;

      state.appliedSearch =
        draft.searchField === "orderDate"
          ? {
              searchField: "orderDate",
              fromDate: draft.fromDate.replaceAll("-", ""),
              toDate: draft.toDate.replaceAll("-", ""),
            }
          : {
              searchField: draft.searchField,
              keyword: draft.keyword.trim(),
            };

      state.page = 1;
    },

    resetSaleOutSearch(state) {
      state.draftSearch = { ...initialDraft };
      state.appliedSearch = { ...initialSearch };
      state.page = 1;
    },

    showCreatedSaleOut(state, action) {
      const saleOutNo = action.payload;

      state.draftSearch = {
        searchField: "saleOutNo",
        keyword: saleOutNo,
        fromDate: "",
        toDate: "",
      };

      state.appliedSearch = {
        searchField: "saleOutNo",
        keyword: saleOutNo,
      };

      state.page = 1;
    },

    setSaleOutPage(state, action) {
      state.page = action.payload;
    },

    setSaleOutPageSize(state, action) {
      state.pageSize = action.payload;
      state.page = 1;
    },

    replaceSaleOut(state, action) {
      const updated = action.payload;
      const index = state.items.findIndex((row) => row.id === updated.id);

      if (index !== -1) {
        state.items[index] = updated;
      }
    },

    removeSaleOut(state, action) {
      const id = action.payload;
      state.items = state.items.filter((row) => row.id !== id);

      const totalPages = Math.max(
        1,
        Math.ceil(state.items.length / state.pageSize),
      );
      state.page = Math.min(state.page, totalPages);
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchSaleOuts.pending, (state, action) => {
        state.status = "loading";
        state.error = "";
        state.currentRequestId = action.meta.requestId;
      })

      .addCase(fetchSaleOuts.fulfilled, (state, action) => {
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

      .addCase(fetchSaleOuts.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return;

        state.currentRequestId = null;

        if (action.meta.aborted) {
          state.status = "idle";
          return;
        }

        state.items = [];
        state.status = "failed";
        state.error = action.error.message ?? "Không thể tải dữ liệu Sale Out.";
      });
  },
});

export const {
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
} = saleOutSlice.actions;

export default saleOutSlice.reducer;
