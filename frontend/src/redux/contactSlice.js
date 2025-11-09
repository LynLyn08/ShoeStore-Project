// frontend/src/redux/contactSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { sendContactFormAPI } from '../api';

export const sendContactForm = createAsyncThunk(
    'contact/sendForm',
    async (formData, { rejectWithValue }) => {
        try {
            const { data } = await api.sendContactFormAPI(formData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const contactSlice = createSlice({
    name: 'contact',
    initialState,
    reducers: {
        resetContactStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendContactForm.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(sendContactForm.fulfilled, (state) => {
                state.status = 'succeeded';
            })
            .addCase(sendContactForm.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể gửi liên hệ.';
            });
    },
});

export const { resetContactStatus } = contactSlice.actions;

export const selectContactStatus = (state) => state.contact.status;
export const selectContactError = (state) => state.contact.error;

export default contactSlice.reducer;