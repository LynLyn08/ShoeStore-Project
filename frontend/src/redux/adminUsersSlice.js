// frontend/src/redux/adminUsersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

// SỬA: Import đúng tên hàm từ api/index.js (thêm Admin vào tên hàm)
import {
    getUsersAdminAPI,      // <-- Đã sửa
    getUserByIdAdminAPI,   // <-- Đã sửa
    createUserAPI,
    updateUserAPI,
    deleteUserAPI,
    resetPasswordByAdminAPI,
    toggleUser2FAAPI
} from '../api';

// --- Async Thunks ---

export const fetchUsers = createAsyncThunk(
    'adminUsers/fetchUsers',
    async (params = { page: 1, limit: 10, keyword: '' }, { rejectWithValue }) => {
        try {
            // SỬA: Gọi đúng tên hàm vừa import
            const { data } = await getUsersAdminAPI(params);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { errors: [{ msg: 'Lỗi kết nối mạng' }] });
        }
    }
);

export const fetchUserDetail = createAsyncThunk(
    'adminUsers/fetchUserDetail',
    async (userId, { rejectWithValue }) => {
        try {
             // SỬA: Gọi đúng tên hàm vừa import
            const { data } = await getUserByIdAdminAPI(userId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { errors: [{ msg: 'Lỗi kết nối' }] });
        }
    }
);

// ... (Các thunk còn lại giữ nguyên vì tên đã đúng)
export const createUser = createAsyncThunk(
    'adminUsers/createUser',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await createUserAPI(formData);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const updateUser = createAsyncThunk(
    'adminUsers/updateUser',
    async ({ userId, formData }, { rejectWithValue }) => {
        try {
            const { data } = await updateUserAPI(userId, formData);
            return data.user;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const deleteUser = createAsyncThunk(
    'adminUsers/deleteUser',
    async (userId, { rejectWithValue }) => {
        try {
            await deleteUserAPI(userId);
            return { userId };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

export const resetUserPassword = createAsyncThunk(
    'adminUsers/resetPassword',
    async (userId, { rejectWithValue }) => { // Chỉ cần userId
        try {
            // SỬA: Không gửi newPassword
            const { data } = await resetPasswordByAdminAPI(userId); 
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// --- Slice Definition ---
const initialState = {
    users: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
    currentUser: { details: null, orders: [], status: 'idle' },
    status: 'idle',
    error: null,
};

const adminUsersSlice = createSlice({
    name: 'adminUsers',
    initialState,
    reducers: {
        clearAdminUsersError: (state) => { state.error = null; }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = action.payload.users;
                state.pagination = {
                    total: action.payload.total,
                    page: parseInt(action.payload.page),
                    limit: parseInt(action.payload.limit),
                    totalPages: Math.ceil(action.payload.total / action.payload.limit) || 1,
                };
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg || 'Lỗi tải dữ liệu người dùng.';
                toast.error(state.error);
            })
            .addCase(fetchUserDetail.pending, (state) => { state.currentUser.status = 'loading'; })
            .addCase(fetchUserDetail.fulfilled, (state, action) => {
                state.currentUser.status = 'succeeded';
                state.currentUser.details = action.payload.user;
                state.currentUser.orders = action.payload.orders;
            })
            .addCase(createUser.fulfilled, (state, action) => {
                state.users.unshift(action.payload);
                toast.success("Tạo người dùng thành công!");
            })
            .addCase(createUser.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Tạo người dùng thất bại.");
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                const index = state.users.findIndex(u => u.UserID === action.payload.UserID);
                if (index !== -1) state.users[index] = { ...state.users[index], ...action.payload };
                toast.success("Cập nhật người dùng thành công!");
            })
            .addCase(updateUser.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Cập nhật thất bại.");
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(u => u.UserID !== action.payload.userId);
                toast.success("Đã xóa người dùng.");
            })
            .addCase(deleteUser.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Xóa thất bại.");
            })
            .addCase(resetUserPassword.fulfilled, (state, action) => {
                toast.success(action.payload.message); // Hiển thị: "Đã gửi email..."
            })
            .addCase(resetUserPassword.rejected, (state, action) => {
                toast.error(action.payload?.errors?.[0]?.msg || "Gửi email reset thất bại.");
            });
            
    },
});

export const { clearAdminUsersError } = adminUsersSlice.actions;
export const selectAdminUsers = (state) => state.adminUsers.users;
export const selectAdminUsersPagination = (state) => state.adminUsers.pagination;
export const selectAdminUsersStatus = (state) => state.adminUsers.status;
export const selectAdminUsersError = (state) => state.adminUsers.error;
export const selectCurrentUserDetail = (state) => state.adminUsers.currentUser;
export default adminUsersSlice.reducer;