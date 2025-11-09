// frontend/src/redux/homeSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api'; // SỬA Ở ĐÂY: Import tất cả API vào một đối tượng

export const fetchHomeData = createAsyncThunk('home/fetchData', async (_, { rejectWithValue }) => {
    try {
        // SỬA Ở ĐÂY: Lấy toàn bộ response và trả về thuộc tính .data
        const response = await api.getHomeDataAPI();
        return response.data; 
    } catch (error) {
        // Trả về lỗi một cách an toàn
        return rejectWithValue(error.response?.data || { message: 'Lỗi mạng hoặc server không phản hồi' });
    }
});

const initialState = {
    products: [],
    blogs: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const homeSlice = createSlice({
    name: 'home',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchHomeData.pending, (state) => {
                state.status = 'loading';
                state.error = null; // Xóa lỗi cũ khi bắt đầu request mới
            })
            .addCase(fetchHomeData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                // SỬA Ở ĐÂY: Gán dữ liệu một cách an toàn để tránh lỗi 'undefined'
                state.products = action.payload?.products || [];
                state.blogs = action.payload?.blogs || [];
            })
            .addCase(fetchHomeData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể tải dữ liệu trang chủ.';
            });
    },
});

export default homeSlice.reducer;