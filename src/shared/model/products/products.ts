import { BASE_URL } from "@/shared/api/_BASE";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const saveProductsToLocalStorage = (products: Product[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("products", JSON.stringify(products));
  }
};

const loadProductsFromLocalStorage = (): Product[] => {
  if (typeof window !== "undefined") {
    const savedProducts = localStorage.getItem("products");
    return savedProducts ? JSON.parse(savedProducts) : [];
  }
  return [];
};

export const getProducts = createAsyncThunk(
  "products/getProducts",
  async (_, thunkApi) => {
    try {
      const res = await axios.get(`${BASE_URL}/products`);
      return res.data;
    } catch (err) {
      console.log(err);
      thunkApi.rejectWithValue(err);
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData: Product, thunkApi) => {
    try {
      const res = await axios.post(`${BASE_URL}/products`, productData);
      return res.data;
    } catch (err) {
      console.log(err);
      thunkApi.rejectWithValue(err);
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (productData: Product, thunkApi) => {
    try {
      const { id, ...data } = productData;
      const res = await axios.put(`${BASE_URL}/products/${id}`, data);
      return res.data;
    } catch (err) {
      console.log(err);
      thunkApi.rejectWithValue(err);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (productId: number | string, thunkApi) => {
    try {
      await axios.delete(`${BASE_URL}/products/${productId}`);
      return productId;
    } catch (err) {
      console.log(err);
      thunkApi.rejectWithValue(err);
    }
  }
);

export type Product = {
  id: number | string;
  title: string;
  price: number;
  category: string;
  description: string;
  image: string;
};

interface ProductState {
  list: Product[];
  filtered: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  list: loadProductsFromLocalStorage(),
  filtered: [],
  loading: false,
  error: null,
};

const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    updateProductData: (state, action: PayloadAction<Product>) => {
      const updatedProduct = action.payload;
      const index = state.list.findIndex(
        (product) => product.id === updatedProduct.id
      );
      if (index !== -1) {
        state.list[index] = updatedProduct;
        saveProductsToLocalStorage(state.list);
      }
    },
    deleteProductFromFiltered: (state, action: PayloadAction<string>) => {
      const productId = action.payload;
      state.filtered = state.filtered.filter(
        (product) => product.id !== productId
      );
    },
  },
  extraReducers: (builder) => {
    builder.addCase(getProducts.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(getProducts.fulfilled, (state, { payload }) => {
      state.list = payload;
      state.loading = false;
      saveProductsToLocalStorage(state.list);
    });
    builder.addCase(getProducts.rejected, (state) => {
      state.loading = false;
      state.error = "Failed to fetch products";
    });
    builder.addCase(createProduct.fulfilled, (state, { payload }) => {
      state.list.push(payload);
      saveProductsToLocalStorage(state.list);
    });
    builder.addCase(createProduct.rejected, (state, { payload }) => {
      state.error = payload ? String(payload) : "Failed to create product";
    });
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const payload = action.payload;
      if (payload && typeof payload.id !== "undefined") {
        const index = state.list.findIndex(
          (product) => product.id == payload.id
        );
        if (index !== -1) {
          state.list[index] = payload;
          saveProductsToLocalStorage(state.list);
        }
      }
    });
    builder.addCase(deleteProduct.fulfilled, (state, action) => {
      const productId = action.payload;
      state.list = state.list.filter((product) => product.id !== productId);
      state.filtered = state.filtered.filter(
        (product) => product.id !== productId
      );
      saveProductsToLocalStorage(state.list);
    });
    builder.addCase(updateProduct.rejected, (state, { payload }) => {
      state.error = payload ? String(payload) : "Failed to update product";
    });
  },
});

export const { updateProductData } = productSlice.actions;

export default productSlice.reducer;
