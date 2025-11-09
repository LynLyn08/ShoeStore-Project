// frontend/src/redux/dashboardSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getDashboardStatsAPI } from '../api';
import { toast } from 'react-toastify';

/**
 * createAsyncThunk để fetch dữ liệu thống kê CHÍNH (thẻ và biểu đồ).
 * Các bảng sẽ được fetch riêng.
 */
export const fetchDashboardStats = createAsyncThunk(
    'dashboard/fetchStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getDashboardStatsAPI();
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || { errors: [{ msg: 'Lỗi kết nối mạng' }] });
        }
    }
);

const initialState = {
    stats: null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        clearDashboardError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDashboardStats.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.stats = action.payload; // Dữ liệu không còn topProducts/lowStock
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg || 'Không thể tải dữ liệu dashboard.';
                toast.error(state.error);
            });
    },
});

export const { clearDashboardError } = dashboardSlice.actions;

// Selectors
export const selectDashboardStats = (state) => state.dashboard.stats;
export const selectDashboardStatus = (state) => state.dashboard.status;
export const selectDashboardError = (state) => state.dashboard.error;

export default dashboardSlice.reducer;