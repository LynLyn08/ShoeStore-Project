// frontend/src/redux/adminCategoriesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api';

export const fetchAdminCategories = createAsyncThunk('adminCategories/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await api.getCategoriesAdminAPI(params);
        return response.data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const createCategory = createAsyncThunk('adminCategories/create', async (categoryData, { rejectWithValue }) => {
    try {
        const response = await api.createCategoryAPI(categoryData);
        // SỬA: Phải là response.data.category
        return response.data.category;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const updateCategory = createAsyncThunk('adminCategories/update', async ({ id, categoryData }, { rejectWithValue }) => {
    try {
        const response = await api.updateCategoryAPI(id, categoryData);
        // SỬA: Phải là response.data.category
        return response.data.category;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const deleteCategory = createAsyncThunk('adminCategories/delete', async (id, { rejectWithValue }) => {
    try {
        await api.deleteCategoryAPI(id);
        return { id };
    } catch (error) { return rejectWithValue(error.response.data); }
});

// SỬA: Đã xóa thunk 'toggleCategoryStatus'

const initialState = {
    categories: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    status: 'idle',
    error: null,
};

const adminCategoriesSlice = createSlice({
    name: 'adminCategories',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminCategories.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminCategories.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.categories = action.payload.categories;
                state.pagination = {
                    total: action.payload.total,
                    page: parseInt(action.payload.page), // Đảm bảo là số
                    limit: parseInt(action.payload.limit), // Đảm bảo là số
                    totalPages: Math.ceil(action.payload.total / action.payload.limit) || 1,
                };
            })
            .addCase(fetchAdminCategories.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg;
            })
            // SỬA: Thêm reducer để tự cập nhật state
            .addCase(createCategory.fulfilled, (state, action) => {
                state.categories.unshift(action.payload); // Thêm vào đầu
                state.pagination.total += 1;
                toast.success("Đã thêm danh mục.");
            })
            .addCase(updateCategory.fulfilled, (state, action) => {
                const index = state.categories.findIndex(c => c.CategoryID === action.payload.CategoryID);
                if (index !== -1) {
                    state.categories[index] = action.payload;
                }
                toast.success("Đã cập nhật danh mục.");
            })
            .addCase(deleteCategory.fulfilled, (state, action) => {
                state.categories = state.categories.filter(c => c.CategoryID !== action.payload.id);
                state.pagination.total -= 1;
                toast.success("Đã xóa danh mục.");
            })
            // SỬA: Đã xóa 'toggleCategoryStatus.fulfilled'
            
            // Handle rejections with toasts
            .addMatcher(
                (action) => action.type.endsWith('/rejected'),
                (state, action) => {
                    // Chỉ toast lỗi nếu không phải là lỗi fetch (fetch đã có <Alert>)
                    if (!action.type.startsWith('adminCategories/fetch')) {
                        toast.error(action.payload?.errors?.[0]?.msg || "Thao tác thất bại.");
                    }
                }
            );
    }
});

export default adminCategoriesSlice.reducer;