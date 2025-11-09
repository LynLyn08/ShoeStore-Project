// frontend/src/redux/adminProductsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

// Import các hàm API đã được định nghĩa cho khu vực admin
import {
    getProductsAdminAPI,
    getProductByIdAdminAPI, // Cần hàm này cho form edit
    createProductAPI,
    updateProductAPI,
    deleteProductAdminAPI,
    getCategoriesAdminAPI // Thêm API lấy danh mục
} from '../api';

// --- Async Thunks ---

export const fetchAdminProducts = createAsyncThunk(
    'adminProducts/fetchProducts',
    async (params = { page: 1, limit: 10 }, { rejectWithValue }) => {
        try {
            // SỬA: Bỏ 'api.'
            const { data } = await getProductsAdminAPI(params);
            return data; // Trả về { products, total, page, limit }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const fetchAdminCategories = createAsyncThunk(
    'adminProducts/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            // SỬA: Bỏ 'api.'
            const { data } = await getCategoriesAdminAPI();
            return data.categories; // Trả về mảng [categories]
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// THÊM: Thunk để lấy chi tiết sản phẩm cho form Sửa
export const fetchAdminProductDetail = createAsyncThunk(
    'adminProducts/fetchProductDetail',
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await getProductByIdAdminAPI(productId);
            return data; // Trả về { product, variants, images, colorImages }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);


export const createAdminProduct = createAsyncThunk(
    'adminProducts/createProduct',
    async (formData, { rejectWithValue }) => {
        try {
             // SỬA: Bỏ 'api.'
            const { data } = await createProductAPI(formData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const updateAdminProduct = createAsyncThunk(
    'adminProducts/updateProduct',
    async ({ productId, formData }, { rejectWithValue }) => {
        try {
            // SỬA: Bỏ 'api.'
            const { data } = await updateProductAPI(productId, formData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const deleteAdminProduct = createAsyncThunk(
    'adminProducts/deleteProduct',
    async (productId, { rejectWithValue }) => {
        try {
            // SỬA: Bỏ 'api.'
            await deleteProductAdminAPI(productId);
            return { productId }; // Trả về ID để cập nhật UI
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);


// --- Slice Definition ---

const initialState = {
    products: [],
    categories: [], // Thêm state cho categories
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
    },
    // Thêm state cho form edit
    currentProduct: {
        details: null,
        variants: [],
        images: [],
        colorImages: {},
        status: 'idle',
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

const adminProductsSlice = createSlice({
    name: 'adminProducts',
    initialState,
    reducers: {
        clearAdminProductsError: (state) => {
            state.error = null;
        },
        // Thêm reducer để reset form
        resetCurrentProduct: (state) => {
            state.currentProduct = initialState.currentProduct;
        }
    },
    extraReducers: (builder) => {
        builder
            // Cases for fetching products list
            .addCase(fetchAdminProducts.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchAdminProducts.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = action.payload.products;
                state.pagination = {
                    total: action.payload.total,
                    page: parseInt(action.payload.page), // Đảm bảo là số
                    limit: parseInt(action.payload.limit), // Đảm bảo là số
                    totalPages: Math.ceil(action.payload.total / action.payload.limit) || 1,
                };
            })
            .addCase(fetchAdminProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.errors?.[0]?.msg || 'Lỗi tải danh sách sản phẩm.';
                toast.error(state.error); // Toast lỗi
            })

            // Case for fetching categories
            .addCase(fetchAdminCategories.fulfilled, (state, action) => {
                state.categories = action.payload;
            })
            
            // Cases for fetching detail
            .addCase(fetchAdminProductDetail.pending, (state) => {
                state.currentProduct.status = 'loading';
            })
            .addCase(fetchAdminProductDetail.fulfilled, (state, action) => {
                state.currentProduct.status = 'succeeded';
                state.currentProduct.details = action.payload.product;
                state.currentProduct.variants = action.payload.variants;
                state.currentProduct.images = action.payload.images;
                state.currentProduct.colorImages = action.payload.colorImages;
            })
            .addCase(fetchAdminProductDetail.rejected, (state, action) => {
                state.currentProduct.status = 'failed';
                toast.error(action.payload?.errors?.[0]?.msg || "Tải chi tiết thất bại.");
            })


            // Cases for creating a product
            .addCase(createAdminProduct.pending, (state) => { state.status = 'loading'; })
            .addCase(createAdminProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                toast.success(action.payload.message || "Tạo sản phẩm thành công!");
                // Không cần push vào state, vì sẽ fetch lại danh sách
            })
            .addCase(createAdminProduct.rejected, (state, action) => {
                state.status = 'failed';
                toast.error(action.payload?.errors?.[0]?.msg || "Tạo sản phẩm thất bại.");
            })

            // Cases for updating a product
            .addCase(updateAdminProduct.pending, (state) => { state.status = 'loading'; })
            .addCase(updateAdminProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                toast.success(action.payload.message || "Cập nhật sản phẩm thành công!");
            })
            .addCase(updateAdminProduct.rejected, (state, action) => {
                state.status = 'failed';
                toast.error(action.payload?.errors?.[0]?.msg || "Cập nhật thất bại.");
            })

            // Cases for deleting a product
            .addCase(deleteAdminProduct.pending, (state) => { state.status = 'loading'; })
            .addCase(deleteAdminProduct.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.products = state.products.filter(p => p.ProductID !== action.payload.productId);
                state.pagination.total -= 1;
                toast.success("Đã xóa sản phẩm.");
            })
            .addCase(deleteAdminProduct.rejected, (state, action) => {
                state.status = 'failed';
                toast.error(action.payload?.errors?.[0]?.msg || "Xóa sản phẩm thất bại.");
            });
    },
});

export const { clearAdminProductsError, resetCurrentProduct } = adminProductsSlice.actions;

// --- Selectors ---
export const selectAdminProducts = (state) => state.adminProducts.products;
export const selectAdminCategories = (state) => state.adminProducts.categories;
export const selectAdminProductsPagination = (state) => state.adminProducts.pagination;
export const selectAdminProductsStatus = (state) => state.adminProducts.status;
export const selectAdminProductsError = (state) => state.adminProducts.error;
export const selectAdminCurrentProduct = (state) => state.adminProducts.currentProduct;

export default adminProductsSlice.reducer;