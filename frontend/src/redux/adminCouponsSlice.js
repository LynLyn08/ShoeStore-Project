// frontend/src/redux/adminCouponsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api';
export const fetchAdminCoupons = createAsyncThunk('adminCoupons/fetch', async (params, { rejectWithValue }) => {
    try {
        const { data } = await api.getCouponsAdminAPI(params);
        return data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const deleteCoupon = createAsyncThunk('adminCoupons/delete', async (id, { rejectWithValue }) => {
    try {
        await api.deleteCouponAPI(id);
        return { id };
    } catch (error) { return rejectWithValue(error.response.data); }
});
export const fetchCouponDetails = createAsyncThunk(
    'adminCoupons/fetchDetails',
    async (couponId, { rejectWithValue }) => {
        try {
            // Gọi song song 2 API
            const [usageRes, assignmentsRes] = await Promise.all([
                // === SỬA LỖI: Thêm 'api.' vào trước các hàm ===
                api.getCouponUsageAPI(couponId),
                api.getCouponAssignmentsAPI(couponId)
                // === KẾT THÚC SỬA LỖI ===
            ]);
            return {
                usage: usageRes.data.usage,
                assignments: assignmentsRes.data.assignments
            };
        } catch (error) {
            // Sửa lại rejectWithValue để bắt lỗi ReferenceError
            const errorMsg = error.response?.data || { errors: [{ msg: 'Thao tác thất bại' }] };
            return rejectWithValue(errorMsg);
        }
    }
);
const initialState = {
    coupons: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    status: 'idle',
    error: null,
    detail: {
        usage: [],
        assignments: [],
        status: 'idle',
        error: null
    }
};

const adminCouponsSlice = createSlice({
    name: 'adminCoupons',
    initialState,
    reducers: {
        clearCouponDetails: (state) => {
            state.detail = {
                usage: [],
                assignments: [],
                status: 'idle',
                error: null
            };
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminCoupons.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminCoupons.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.coupons = action.payload.coupons;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    limit: action.payload.limit,
                    totalPages: Math.ceil(action.payload.total / action.payload.limit),
                };
            })
            .addCase(fetchAdminCoupons.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg;
            })
            .addCase(deleteCoupon.fulfilled, (state, action) => {
                state.coupons = state.coupons.filter(c => c.CouponID !== action.payload.id);
                toast.success("Đã xóa coupon.");
            })
           .addCase(deleteCoupon.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Xóa coupon thất bại.");
            })
            .addCase(fetchCouponDetails.pending, (state) => {
                state.detail.status = 'loading';
            })
            .addCase(fetchCouponDetails.fulfilled, (state, action) => {
                state.detail.status = 'succeeded';
                state.detail.usage = action.payload.usage;
                state.detail.assignments = action.payload.assignments;
            })
            .addCase(fetchCouponDetails.rejected, (state, action) => {
                state.detail.status = 'failed';
                // Sửa: Lấy lỗi từ rejectWithValue đã sửa ở trên
                state.detail.error = action.payload?.errors?.[0]?.msg || 'Không thể tải chi tiết.';
                // Báo lỗi ra toast để người dùng biết
                toast.error(action.payload?.errors?.[0]?.msg || 'Không thể tải chi tiết.');
            });
    }
});

export const { clearCouponDetails } = adminCouponsSlice.actions;
export default adminCouponsSlice.reducer;