import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api'; 

// === BƯỚC 1: ĐỊNH NGHĨA LẠI ĐẦY ĐỦ CÁC THUNKS ===
export const fetchUserWalletVouchers = createAsyncThunk(
    'profile/fetchUserWalletVouchers', 
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.getUserVouchersAPI(); 
            return response.data.vouchers;   
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchUserOrders = createAsyncThunk(
    'profile/fetchUserOrders', 
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.getUserOrdersAPI(params);
            return response.data;   
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchOrderDetail = createAsyncThunk(
    'profile/fetchOrderDetail', 
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.getOrderDetailAPI(orderId);
            return response.data;   
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const cancelUserOrder = createAsyncThunk(
    'profile/cancelUserOrder', 
    async (orderId, { rejectWithValue }) => {
        try {
            const response = await api.cancelOrderAPI(orderId);
            return { orderId, ...response.data };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchPaginatedWishlist = createAsyncThunk(
    'profile/fetchPaginatedWishlist', 
    async (params, { rejectWithValue }) => {
        try {
            const response = await api.getPaginatedWishlistAPI(params);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);
// === KẾT THÚC BƯỚC 1 ===


// === BƯỚC 2: SỬA LẠI initialState ===
const initialState = {
    orders: {
        data: [],
        status: 'idle',
        error: null
    },
    wishlist: {
        data: { items: [], total: 0, page: 1, pageSize: 8 },
        status: 'idle',
        error: null
    },
    orderDetail: { 
        data: null, 
        status: 'idle', 
        error: null 
    },
    userVouchers: { 
        data: [], 
        status: 'idle', 
        error: null 
    },
};

const profileSlice = createSlice({
    name: 'profile',
    initialState,
    reducers: {
        resetVoucherStatus: (state) => {
            state.userVouchers.status = 'idle';
            state.userVouchers.data = [];
            state.orders.status = 'idle';
            state.wishlist.status = 'idle';
            resetVoucherStatus
        }
    },
    // === BƯỚC 3: SỬA LẠI extraReducers (Bổ sung đầy đủ) ===
    extraReducers: (builder) => {
        builder
            // Orders
            .addCase(fetchUserOrders.pending, (state) => { 
                state.orders.status = 'loading'; 
            })
            .addCase(fetchUserOrders.fulfilled, (state, action) => {
                state.orders.status = 'succeeded';
                state.orders.data = action.payload;
            })
            .addCase(fetchUserOrders.rejected, (state, action) => {
                state.orders.status = 'failed';
                state.orders.error = action.payload?.message || 'Lỗi tải đơn hàng.';
            })
            
            // Order Detail
            .addCase(fetchOrderDetail.pending, (state) => { 
                state.orderDetail.status = 'loading'; 
            })
            .addCase(fetchOrderDetail.fulfilled, (state, action) => {
                state.orderDetail.status = 'succeeded';
                state.orderDetail.data = action.payload;
            })
            .addCase(fetchOrderDetail.rejected, (state, action) => {
                state.orderDetail.status = 'failed';
                state.orderDetail.error = action.payload?.message || 'Lỗi tải chi tiết đơn hàng.';
            })
            
            // Cancel Order
            .addCase(cancelUserOrder.fulfilled, (state, action) => {
                const index = state.orders.data.findIndex(o => o.OrderID === action.payload.orderId);
                if (index !== -1) {
                    state.orders.data[index].Status = 'Cancelled';
                }
                if (state.orderDetail.data?.Order?.OrderID === action.payload.orderId) {
                    state.orderDetail.data.Order.Status = 'Cancelled';
                }
            })
            
            // User Vouchers
            .addCase(fetchUserWalletVouchers.pending, (state) => { 
                state.userVouchers.status = 'loading'; 
            })
            .addCase(fetchUserWalletVouchers.fulfilled, (state, action) => {
                state.userVouchers.status = 'succeeded';
                state.userVouchers.data = action.payload;
            })
            .addCase(fetchUserWalletVouchers.rejected, (state, action) => {
                state.userVouchers.status = 'failed';
                state.userVouchers.error = action.payload?.message || 'Lỗi tải ví voucher.';
            })
            
            // Wishlist
            .addCase(fetchPaginatedWishlist.pending, (state) => { 
                state.wishlist.status = 'loading'; 
            })
            .addCase(fetchPaginatedWishlist.fulfilled, (state, action) => {
                state.wishlist.status = 'succeeded';
                state.wishlist.data = action.payload;
            })
            .addCase(fetchPaginatedWishlist.rejected, (state, action) => {
                state.wishlist.status = 'failed';
                state.wishlist.error = action.payload?.message || 'Lỗi tải danh sách yêu thích.';
            });
    }
});

export const { resetVoucherStatus } = profileSlice.actions;
export default profileSlice.reducer;