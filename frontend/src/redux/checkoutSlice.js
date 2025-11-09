// frontend/src/redux/checkoutSlice.js (đầy đủ, chỉ sửa validateCoupon)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api';

export const fetchCheckoutData = createAsyncThunk('checkout/fetchData', async (isUser, { rejectWithValue }) => {
    try {
        const promises = [
            api.getShippingProvidersAPI(),
            api.getAvailableCouponsAPI(),
            api.getPaymentMethodsAPI()
        ];

        if (isUser) {
            promises.push(api.getAddressesAPI());
        }
        
        const results = await Promise.all(promises);
        const [providersRes, couponsRes, paymentMethodsRes, addressesRes] = results;

        return {
            providers: providersRes?.data || [],
            coupons: couponsRes?.data?.coupons || couponsRes?.data || couponsRes || [],
            paymentMethods: paymentMethodsRes?.data || [],
            addresses: addressesRes?.data?.data || addressesRes?.data || addressesRes || [],
        };
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

export const validateCoupon = createAsyncThunk('checkout/validateCoupon', async (payload, { rejectWithValue }) => {
    try {
        // SỬA: Gửi trực tiếp {code, total} để match backend schema (loại bỏ TotalAmount)
        const { data } = await api.validateCouponAPI(payload);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const placeOrder = createAsyncThunk('checkout/placeOrder', async ({ payload, isUser }, { rejectWithValue }) => {
    try {
        const apiCall = isUser ? api.placeUserOrderAPI : api.placeGuestOrderAPI;
        const { data } = await apiCall(payload);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const createNewAddress = createAsyncThunk('checkout/createNewAddress', async (addressData, { dispatch, rejectWithValue }) => {
    try {
        const { data } = await api.createAddressAPI(addressData);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});
export const fetchUserVouchers = createAsyncThunk('checkout/fetchUserVouchers', async (_, { rejectWithValue }) => {
    try {
        const { data } = await api.getUserVouchersAPI();
        return data.vouchers;
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});
const initialState = {
    addresses: [],
    providers: [],
    coupons: [],
    paymentMethods: [],
    status: 'idle',
    error: null,
    orderStatus: 'idle',
    orderError: null,
    userVouchers: [], 
    userVouchersStatus: 'idle',
    couponDiscount: 0,
    couponNote: '',
    validatingCoupon: false,
};

const checkoutSlice = createSlice({
    name: 'checkout',
    initialState,
    reducers: {
        clearCoupon: (state) => {
            state.couponDiscount = 0;
            state.couponNote = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCheckoutData.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchCheckoutData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.addresses = Array.isArray(action.payload.addresses) ? action.payload.addresses : [];
                state.providers = Array.isArray(action.payload.providers) ? action.payload.providers : [];
                state.coupons = Array.isArray(action.payload.coupons) ? action.payload.coupons : [];
                state.paymentMethods = Array.isArray(action.payload.paymentMethods) ? action.payload.paymentMethods : [];
            })
            .addCase(fetchCheckoutData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || "Lỗi tải dữ liệu checkout";
            })
          .addCase(validateCoupon.pending, (state) => { 
                state.validatingCoupon = true; 
                state.couponNote = 'Đang kiểm tra...'; // Thêm ghi chú chờ
            })
            .addCase(validateCoupon.fulfilled, (state, action) => {
                state.validatingCoupon = false;
                if (action.payload.valid) {
                    state.couponDiscount = action.payload.discount || 0;
                    
                    // Logic hiển thị ghi chú đúng
                    const { type, value } = action.payload;
                    if (type === 'Percent') {
                        state.couponNote = `Áp dụng thành công (Giảm ${value}%)`;
                    } else if (type === 'FixedAmount') {
                        state.couponNote = `Áp dụng thành công (Giảm ${Number(value).toLocaleString('vi-VN')}₫)`;
                    } else {
                        state.couponNote = 'Áp dụng thành công.';
                    }

                } else {
                    state.couponDiscount = 0;
                    state.couponNote = action.payload.message || 'Mã không hợp lệ.';
                }
            })
            .addCase(validateCoupon.rejected, (state, action) => {
                state.validatingCoupon = false;
                state.couponDiscount = 0;
                state.couponNote = action.payload?.message || 'Lỗi xác thực mã';
            })
            .addCase(placeOrder.pending, (state) => { state.orderStatus = 'loading'; state.orderError = null; })
            .addCase(placeOrder.fulfilled, (state) => { 
                state.orderStatus = 'succeeded'; 
                state.couponDiscount = 0;
            })
            .addCase(fetchUserVouchers.pending, (state) => { state.userVouchersStatus = 'loading'; })
            .addCase(fetchUserVouchers.fulfilled, (state, action) => {
                state.userVouchersStatus = 'succeeded';
                // Lọc các voucher chưa được sử dụng
                state.userVouchers = action.payload.filter(v => !v.IsUsedInWallet); 
            })
            .addCase(fetchUserVouchers.rejected, (state, action) => {
                state.userVouchersStatus = 'failed';
                console.error("Fetch user vouchers failed:", action.payload);
            })
            .addCase(placeOrder.rejected, (state, action) => {
                state.orderStatus = 'failed';
                state.orderError = action.payload?.message || 'Đặt hàng thất bại.';
            });
    }
});

export const { clearCoupon } = checkoutSlice.actions;
export default checkoutSlice.reducer;