import { configureStore } from "@reduxjs/toolkit";
import productsReducer from "../features/products/productsSlice";
import saleOutReducer from "../features/saleOut/saleOutSlice";

export const store = configureStore({
  reducer: {
    products: productsReducer,
    saleOut: saleOutReducer,
  },
});
