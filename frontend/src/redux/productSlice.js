// frontend/src/redux/productSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api'; // SỬA DÒNG NÀY

export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async (params, { rejectWithValue }) => {
        try {
            // SỬA CÁCH GỌI VÀ TRẢ VỀ DATA
            const response = await api.getProductsAPI(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Lỗi mạng' });
        }
    }
);

const initialState = {
    items: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 8,
        totalPages: 1,
    },
    status: 'idle',
    error: null,
};

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload.products || [];
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    limit: action.payload.limit,
                    totalPages: Math.ceil(action.payload.total / action.payload.limit),
                };
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể tải sản phẩm.';
            });
    },
});

export const selectAllProducts = (state) => state.products.items;
export const selectProductsPagination = (state) => state.products.pagination;
export const selectProductsStatus = (state) => state.products.status;
export const selectProductsError = (state) => state.products.error;

export default productSlice.reducer;