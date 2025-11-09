import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';
import * as api from '../api';
// --- Async Thunks ---

// Thunk để lấy danh sách phương thức thanh toán (có phân trang và lọc)
export const fetchPaymentMethods = createAsyncThunk(
    'adminPaymentMethods/fetchMethods',
    async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
        try {
            // SỬA DÒNG NÀY:
            // Lỗi (cũ): const { data } = await api.getPaymentMethodsAPI(params);
            // Sửa (mới):
            const { data } = await api.getAdminPaymentMethodsAPI(params);
            
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Thunk để tạo một phương thức thanh toán mới
export const createPaymentMethod = createAsyncThunk(
    'adminPaymentMethods/createMethod',
    async (methodData, { rejectWithValue }) => {
        try {
            const { data } = await api.createPaymentMethodAPI(methodData);
            return data.method;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Thunk để cập nhật một phương thức thanh toán
export const updatePaymentMethod = createAsyncThunk(
    'adminPaymentMethods/updateMethod',
    async ({ id, methodData }, { rejectWithValue }) => {
        try {
            const { data } = await api.updatePaymentMethodAPI(id, methodData);
            return data.method;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// Thunk để xóa một phương thức thanh toán
export const deletePaymentMethod = createAsyncThunk(
    'adminPaymentMethods/deleteMethod',
    async (id, { rejectWithValue }) => {
        try {
            await api.deletePaymentMethodAPI(id);
            return { id }; // Trả về ID để cập nhật UI
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);


// --- Slice Definition ---

const initialState = {
    methods: [],
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const adminPaymentMethodsSlice = createSlice({
    name: 'adminPaymentMethods',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Cases for fetching list
            .addCase(fetchPaymentMethods.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchPaymentMethods.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.methods = action.payload.paymentMethods;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    limit: action.payload.limit,
                    totalPages: Math.ceil(action.payload.total / action.payload.limit),
                };
            })
            .addCase(fetchPaymentMethods.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg || 'Lỗi tải dữ liệu.';
            })

            // Case for creating
            .addCase(createPaymentMethod.fulfilled, (state, action) => {
                // Không cần thêm trực tiếp vào state, vì component sẽ fetch lại
                toast.success("Tạo mới thành công!");
            })

            // Case for updating
            .addCase(updatePaymentMethod.fulfilled, (state, action) => {
                const index = state.methods.findIndex(m => m.MethodID === action.payload.MethodID);
                if (index !== -1) {
                    state.methods[index] = action.payload;
                }
                toast.success("Cập nhật thành công!");
            })
            
            // Case for deleting
            .addCase(deletePaymentMethod.fulfilled, (state, action) => {
                state.methods = state.methods.filter(m => m.MethodID !== action.payload.id);
                state.pagination.total -= 1;
                toast.success("Đã xóa phương thức thanh toán.");
            })

            // Generic rejected case for actions that show a toast
            .addMatcher(
                (action) => [createPaymentMethod.rejected, updatePaymentMethod.rejected, deletePaymentMethod.rejected].includes(action.type),
                (state, action) => {
                    const errorMessage = action.payload?.errors?.[0]?.msg || "Thao tác thất bại.";
                    toast.error(errorMessage);
                }
            );
    },
});

// phần export trong adminPaymentMethodsSlice.js
export const { clearError } = adminPaymentMethodsSlice.actions;

export const selectAllPaymentMethods = (state) => state.adminPaymentMethods.methods;
export const selectPaymentMethodsPagination = (state) => state.adminPaymentMethods.pagination;
export const selectPaymentMethodsStatus = (state) => state.adminPaymentMethods.status;
export const selectPaymentMethodsError = (state) => state.adminPaymentMethods.error;

export default adminPaymentMethodsSlice.reducer;