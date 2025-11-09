// frontend/src/redux/productDetailSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../api';

// Thunks
export const fetchProductAllData = createAsyncThunk(
    'productDetail/fetchAll',
    async (productId, { dispatch, rejectWithValue }) => {
        try {
            // Chạy song song các API để tăng tốc độ
            const [detailRes, reviewsRes, wishlistRes] = await Promise.all([
                api.getProductDetailAPI(productId),
                // SỬA: Gọi API review mới với params (mặc định trang 1)
                api.getProductReviewsAPI(productId, { page: 1, limit: 5 }), 
                api.getWishlistIdsAPI() // Lấy wishlist để biết trạng thái like
            ]);
            
            // Sau khi có dữ liệu chính, fetch sản phẩm liên quan
            const categoryId = detailRes.data.product?.CategoryID;
            if (categoryId) {
                dispatch(fetchRelatedProducts({ categoryId, currentProductId: productId }));
            }
            
            return {
                detail: detailRes.data,
                reviews: reviewsRes.data, // Dữ liệu trả về giờ là { reviews: [], statistics: {}, ... }
                wishlist: wishlistRes.data.productIds || []
            };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

// THÊM THUNK MỚI: Lấy thêm trang đánh giá
export const fetchProductReviewsPage = createAsyncThunk(
    'productDetail/fetchReviewsPage',
    async ({ productId, page, limit = 5 }, { rejectWithValue }) => {
        try {
            const { data } = await api.getProductReviewsAPI(productId, { page, limit });
            return data; // Trả về { reviews, total, page, limit, statistics }
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);


export const fetchRelatedProducts = createAsyncThunk(
    'productDetail/fetchRelated',
    async ({ categoryId, currentProductId }, { rejectWithValue }) => {
        try {
            const { data } = await api.getProductsAPI({ categoryId, limit: 8 });
            // Lọc ra sản phẩm hiện tại khỏi danh sách liên quan
            const related = data.products.filter(p => p.ProductID !== currentProductId);
            return related;
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

export const toggleProductWishlist = createAsyncThunk(
    'productDetail/toggleWishlist',
    async (productId, { rejectWithValue }) => {
        try {
            const { data } = await api.toggleWishlistAPI(productId);
            return { productId, liked: data.liked };
        } catch (error) {
            return rejectWithValue(error.response.data);
        }
    }
);

const initialState = {
    data: null, // { product, variants }
    reviews: [],
    // SỬA: Dùng reviewStats object
    reviewStats: { 
        totalReviews: 0, 
        averageRating: 0, 
        ratingSummary: {}, 
        page: 1, 
        totalPages: 1 
    },
    relatedProducts: [],
    wishlist: [], 
    status: 'idle',
    error: null,
};

const productDetailSlice = createSlice({
    name: 'productDetail',
    initialState,
    reducers: {
        clearProductDetail: () => initialState,
        // THÊM: Reducer để thêm review mới vào state
        addNewReview: (state, action) => {
            state.reviews.unshift(action.payload); // Thêm review mới lên đầu
            state.reviewStats.totalReviews += 1;
            // (Lưu ý: Tính lại avg rating ở đây sẽ phức tạp, tải lại trang vẫn tốt hơn)
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductAllData.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProductAllData.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.data = action.payload.detail;
                state.reviews = action.payload.reviews.reviews;
                // SỬA: Lưu trữ statistics mới
                state.reviewStats = {
                    ...action.payload.reviews.statistics,
                    page: action.payload.reviews.page,
                    totalPages: Math.ceil(action.payload.reviews.total / action.payload.reviews.limit)
                };
                state.wishlist = action.payload.wishlist;
            })
            .addCase(fetchProductAllData.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể tải dữ liệu sản phẩm.';
            })
            .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
                state.relatedProducts = action.payload;
            })
            .addCase(toggleProductWishlist.fulfilled, (state, action) => {
                const { productId, liked } = action.payload;
                if (liked) {
                    if (!state.wishlist.includes(productId)) {
                        state.wishlist.push(productId);
                    }
                } else {
                    state.wishlist = state.wishlist.filter(id => id !== productId);
                }
            })
            // THÊM: Xử lý khi tải thêm trang review
            .addCase(fetchProductReviewsPage.fulfilled, (state, action) => {
                // Nối mảng review cũ và mới (chú ý trùng lặp nếu cần)
                // Cách đơn giản là thay thế hoàn toàn
                state.reviews = action.payload.reviews;
                state.reviewStats.page = action.payload.page;
            })
            .addCase(fetchProductReviewsPage.rejected, (state, action) => {
                // (Có thể toast thông báo lỗi)
            });
    }
});

export const { clearProductDetail, addNewReview } = productDetailSlice.actions;
export default productDetailSlice.reducer;