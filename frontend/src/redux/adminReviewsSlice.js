// frontend/src/redux/adminReviewsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

// SỬA: Import đúng tên hàm API từ 'api/index.js' (dựa trên log lỗi trước)
import {
    getReviewsAdminAPI,
    deleteReviewAPI
} from '../api';

export const fetchAdminReviews = createAsyncThunk(
    'adminReviews/fetch', 
    async (params, { rejectWithValue }) => {
    try {
        // SỬA: Đảm bảo tên hàm này (getReviewsAdminAPI) khớp với file 'api/index.js'
        const { data } = await getReviewsAdminAPI(params);
        return data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const deleteReview = createAsyncThunk(
    'adminReviews/delete', 
    async (id, { rejectWithValue }) => {
    try {
        // SỬA: Đảm bảo tên hàm này (deleteReviewAPI) khớp với file 'api/index.js'
        await deleteReviewAPI(id);
        return { id };
    } catch (error) { return rejectWithValue(error.response.data); }
});

const initialState = {
    reviews: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    status: 'idle',
    error: null,
};

const adminReviewsSlice = createSlice({
    name: 'adminReviews',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminReviews.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminReviews.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.reviews = action.payload.reviews;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page, // Đảm bảo API trả về 'page'
                    limit: action.payload.limit, // Đảm bảo API trả về 'limit'
                    totalPages: Math.ceil(action.payload.total / (action.payload.limit || 10)),
                };
            })
            .addCase(fetchAdminReviews.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg;
            })
            .addCase(deleteReview.fulfilled, (state, action) => {
                state.reviews = state.reviews.filter(r => r.ReviewID !== action.payload.id);
                toast.success("Đã xóa đánh giá.");
            })
            .addCase(deleteReview.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Xóa thất bại.");
            });
    }
});

// SỬA: Thêm các selector
export const selectAdminReviews = (state) => state.adminReviews.reviews;
export const selectAdminReviewsPagination = (state) => state.adminReviews.pagination;
export const selectAdminReviewsStatus = (state) => state.adminReviews.status;
export const selectAdminReviewsError = (state) => state.adminReviews.error;

export default adminReviewsSlice.reducer;