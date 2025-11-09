// frontend/src/redux/adminBlogsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api';
export const fetchAdminBlogs = createAsyncThunk('adminBlogs/fetch', async (params, { rejectWithValue }) => {
    try {
        const response = await api.getBlogsAdminAPI(params);
        return response.data
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const deleteBlog = createAsyncThunk('adminBlogs/delete', async (id, { rejectWithValue }) => {
    try {
        await api.deleteBlogAPI(id);
        return { id };
    } catch (error) { return rejectWithValue(error.response.data); }
});

const initialState = {
    blogs: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    status: 'idle',
    error: null,
};

const adminBlogsSlice = createSlice({
    name: 'adminBlogs',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminBlogs.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminBlogs.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.blogs = action.payload.blogs;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    limit: action.payload.limit,
                    totalPages: Math.ceil(action.payload.total / action.payload.limit),
                };
            })
            .addCase(fetchAdminBlogs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg;
            })
            .addCase(deleteBlog.fulfilled, (state, action) => {
                state.blogs = state.blogs.filter(b => b.BlogID !== action.payload.id);
                toast.success("Đã xóa bài viết.");
            })
            .addCase(deleteBlog.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Xóa thất bại.");
            });
    }
});

export default adminBlogsSlice.reducer;