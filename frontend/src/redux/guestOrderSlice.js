// frontend/src/redux/guestOrderSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { lookupGuestOrdersAPI, getGuestOrderDetailAPI, cancelGuestOrderAPI } from '../api';

export const lookupGuestOrders = createAsyncThunk('guestOrder/lookup', async (credentials, { rejectWithValue }) => {
    try {
        const { data } = await api.lookupGuestOrdersAPI(credentials);
        return data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const fetchGuestOrderDetail = createAsyncThunk('guestOrder/fetchDetail', async (orderId, { rejectWithValue }) => {
    try {
        const { data } = await api.getGuestOrderDetailAPI(orderId);
        return data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

export const cancelGuestOrder = createAsyncThunk('guestOrder/cancel', async (orderId, { rejectWithValue }) => {
    try {
        const { data } = await api.cancelGuestOrderAPI(orderId);
        return data;
    } catch (error) { return rejectWithValue(error.response.data); }
});

const initialState = {
    ordersByStatus: null,
    detail: { data: null, status: 'idle', error: null },
    lookupStatus: 'idle',
    lookupError: null,
};

const guestOrderSlice = createSlice({
    name: 'guestOrder',
    initialState,
    reducers: {
        clearLookup: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(lookupGuestOrders.pending, (state) => { state.lookupStatus = 'loading'; })
            .addCase(lookupGuestOrders.fulfilled, (state, action) => {
                state.lookupStatus = 'succeeded';
                state.ordersByStatus = action.payload;
            })
            .addCase(lookupGuestOrders.rejected, (state, action) => {
                state.lookupStatus = 'failed';
                state.lookupError = action.payload?.errors?.[0]?.msg || 'Tra cứu thất bại.';
            })
            .addCase(fetchGuestOrderDetail.pending, (state) => { state.detail.status = 'loading'; })
            .addCase(fetchGuestOrderDetail.fulfilled, (state, action) => {
                state.detail.status = 'succeeded';
                state.detail.data = action.payload;
            })
            .addCase(fetchGuestOrderDetail.rejected, (state, action) => {
                state.detail.status = 'failed';
                state.detail.error = action.payload?.message;
            })
            .addCase(cancelGuestOrder.fulfilled, (state, action) => {
                // Cập nhật trạng thái trong danh sách và chi tiết
                const cancelledOrder = action.payload.Order;
                if (state.ordersByStatus) {
                    state.ordersByStatus.Pending = state.ordersByStatus.Pending.filter(o => o.GuestOrderID !== cancelledOrder.GuestOrderID);
                    state.ordersByStatus.Cancelled.unshift(cancelledOrder);
                }
                if (state.detail.data?.Order?.GuestOrderID === cancelledOrder.GuestOrderID) {
                    state.detail.data.Order.Status = 'Cancelled';
                }
            });
    }
});

export const { clearLookup } = guestOrderSlice.actions;
export default guestOrderSlice.reducer;