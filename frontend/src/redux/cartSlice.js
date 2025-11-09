// frontend/src/redux/cartSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api'; 

// --- Async Thunks ---

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
    try {
        const response = await api.getCartAPI();
        return response.data; // Trả về toàn bộ object giỏ hàng
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

export const addToCart = createAsyncThunk('cart/addToCart', async (itemData, { rejectWithValue }) => {
    try {
        const response = await api.addToCartAPI(itemData);
        return response.data; // Trả về object giỏ hàng đã cập nhật
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

export const updateCartItemQuantity = createAsyncThunk('cart/updateQuantity', async ({ cartItemId, quantity }, { rejectWithValue }) => {
    try {
        const response = await api.updateCartItemAPI({ cartItemId, quantity });
        return response.data; // Trả về object giỏ hàng đã cập nhật
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

export const removeCartItem = createAsyncThunk('cart/removeItem', async (cartItemId, { rejectWithValue }) => {
    try {
        // SỬA: Await full response từ API (backend return items)
        const response = await api.removeCartItemAPI(cartItemId);
        return response.data;  // Return full { success, items }
    } catch (error) {
        return rejectWithValue(error.response?.data);
    }
});

// --- Slice Definition ---

const initialState = {
    items: [],
    status: 'idle',
    error: null,
};

const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCartLocal: (state) => {
            state.items = [];
        }
    },
    extraReducers: (builder) => {
        // Hàm chung để xử lý khi request thành công (ngoại trừ remove)
        const handleCartSuccess = (state, action) => {
            state.status = 'succeeded';
            state.items = action.payload?.items || [];
        };
        
        builder
            .addCase(fetchCart.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchCart.fulfilled, handleCartSuccess)
            .addCase(fetchCart.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể tải giỏ hàng.';
                // Không toast lỗi ở đây để tránh làm phiền
            })
            .addCase(addToCart.fulfilled, (state, action) => {
                handleCartSuccess(state, action);
                toast.success("Đã thêm vào giỏ hàng!");
            })
            .addCase(addToCart.rejected, (state, action) => {
                toast.error(action.payload?.message || "Lỗi khi thêm vào giỏ hàng.");
            })
            .addCase(updateCartItemQuantity.fulfilled, handleCartSuccess)
            .addCase(removeCartItem.fulfilled, (state, action) => {
                // SỬA: Dùng handleCartSuccess để refetch full từ backend (không local filter)
                handleCartSuccess(state, action);
                toast.success("Đã xóa sản phẩm.");
            })
            .addCase(removeCartItem.rejected, (state, action) => {
                toast.error(action.payload?.message || "Lỗi khi xóa sản phẩm.");
            });
    }
});

export const { clearCartLocal } = cartSlice.actions;

// --- Selectors ---
export const selectCartItems = (state) => state.cart.items;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export const selectCartTotalItems = (state) => state.cart.items.reduce((total, item) => total + item.Quantity, 0);
export const selectCartTotalPrice = (state) => state.cart.items.reduce((total, item) => total + (item.Price * item.Quantity), 0);

export default cartSlice.reducer;