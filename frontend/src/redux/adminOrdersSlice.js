// frontend/src/redux/adminOrdersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api';

export const fetchAdminOrders = createAsyncThunk('adminOrders/fetch', async (params, { rejectWithValue }) => {
    try {
        const { data } = await api.getAdminOrdersAPI(params);
        return { ...data, type: params.customerType };
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const updateOrderStatus = createAsyncThunk('adminOrders/updateStatus', async ({ type, id, status }, { rejectWithValue }) => {
    try {
        await api.updateAdminOrderStatusAPI(type, id, status);
        return { type, id, status };
    } catch (error) { return rejectWithValue(error.response.data); }
});

const initialState = {
    userOrders: [],
    guestOrders: [],
    userPagination: { total: 0, page: 1, totalPages: 1, limit: 10 },
    guestPagination: { total: 0, page: 1, totalPages: 1, limit: 10 },
    status: 'idle',
    error: null,
};

const adminOrdersSlice = createSlice({
    name: 'adminOrders',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAdminOrders.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchAdminOrders.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const { orders, total, page, limit, type } = action.payload;
                
                // Đảm bảo các giá trị là số
                const numPage = parseInt(page) || 1;
                const numLimit = parseInt(limit) || 10;
                const numTotal = parseInt(total) || 0;

                const pagination = { 
                    total: numTotal, 
                    page: numPage, 
                    limit: numLimit,
                    totalPages: Math.ceil(numTotal / numLimit) || 1
                };

                if (type === 'user') {
                    state.userOrders = orders;
                    state.userPagination = pagination;
                } else {
                    state.guestOrders = orders;
                    state.guestPagination = pagination;
                }
            })
            .addCase(fetchAdminOrders.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action) => {
                const { type, id, status } = action.payload;
                
                // SỬA LỖI: Dùng đúng ID Key
                const idKey = type === 'user' ? 'OrderID' : 'GuestOrderID';
                const list = type === 'user' ? state.userOrders : state.guestOrders;
                
                const index = list.findIndex(o => o[idKey] === id); // Tìm bằng 'OrderID' hoặc 'GuestOrderID'
                
                if (index !== -1) {
                    list[index].Status = status;
                }
                toast.success("Cập nhật trạng thái thành công.");
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Cập nhật thất bại.");
            });
    }
});
// Thêm vào cuối file adminOrdersSlice.js
export const selectAdminUserOrders = (state) => state.adminOrders.userOrders;
export const selectAdminGuestOrders = (state) => state.adminOrders.guestOrders;
export const selectAdminUserPagination = (state) => state.adminOrders.userPagination;
export const selectAdminGuestPagination = (state) => state.adminOrders.guestPagination;
export const selectAdminOrdersStatus = (state) => state.adminOrders.status;
export const selectAdminOrdersError = (state) => state.adminOrders.error;

export default adminOrdersSlice.reducer;