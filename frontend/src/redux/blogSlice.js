// frontend/src/redux/blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getBlogsAPI, getBlogByIdAPI, getBlogCategoriesAPI, getBlogTagsAPI } from '../api';

// --- Async Thunks ---

export const fetchBlogs = createAsyncThunk('blogs/fetchBlogs', async (params, { rejectWithValue }) => {
    try {
        const { data } = await api.getBlogsAPI(params);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const fetchBlogById = createAsyncThunk('blogs/fetchBlogById', async (blogId, { rejectWithValue }) => {
    try {
        const { data } = await api.getBlogByIdAPI(blogId);
        return data;
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

export const fetchBlogFilters = createAsyncThunk('blogs/fetchFilters', async (_, { rejectWithValue }) => {
    try {
        const [categoriesRes, tagsRes] = await Promise.all([
            api.getBlogCategoriesAPI(),
            api.getBlogTagsAPI(),
        ]);
        return {
            categories: categoriesRes.data || [],
            tags: tagsRes.data || [],
        };
    } catch (error) {
        return rejectWithValue(error.response.data);
    }
});

const initialState = {
    posts: [],
    categories: [],
    tags: [],
    currentPost: null, // State để lưu chi tiết bài viết đang xem
    pagination: {
        total: 0, page: 1, limit: 9, totalPages: 1,
    },
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' - cho danh sách
    detailStatus: 'idle', // State status riêng cho trang chi tiết
    error: null,
};

const blogSlice = createSlice({
    name: 'blogs',
    initialState,
    reducers: {
        // Reducer để dọn dẹp state của trang chi tiết khi người dùng rời đi
        clearCurrentPost: (state) => {
            state.currentPost = null;
            state.detailStatus = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Cases cho fetchBlogs (danh sách)
            .addCase(fetchBlogs.pending, (state) => { state.status = 'loading'; })
            .addCase(fetchBlogs.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.posts = action.payload.blogs;
                state.pagination = {
                    total: action.payload.total,
                    page: action.payload.page,
                    limit: action.payload.limit,
                    totalPages: Math.ceil(action.payload.total / action.payload.limit),
                };
            })
            .addCase(fetchBlogs.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.message || 'Không thể tải bài viết.';
            })
            // Cases cho fetchBlogById (chi tiết)
            .addCase(fetchBlogById.pending, (state) => { state.detailStatus = 'loading'; })
            .addCase(fetchBlogById.fulfilled, (state, action) => {
                state.detailStatus = 'succeeded';
                state.currentPost = action.payload;
            })
            .addCase(fetchBlogById.rejected, (state, action) => {
                state.detailStatus = 'failed';
                state.error = action.payload?.message || 'Không thể tải chi tiết bài viết.';
            })
            // Cases cho fetchBlogFilters
            .addCase(fetchBlogFilters.fulfilled, (state, action) => {
                state.categories = action.payload.categories;
                state.tags = action.payload.tags;
            });
    },
});

export const { clearCurrentPost } = blogSlice.actions;

// --- Selectors ---
export const selectAllBlogs = (state) => state.blogs.posts;
export const selectBlogPagination = (state) => state.blogs.pagination;
export const selectBlogStatus = (state) => state.blogs.status;
export const selectBlogError = (state) => state.blogs.error;
export const selectBlogCategories = (state) => state.blogs.categories;
export const selectBlogTags = (state) => state.blogs.tags;
export const selectCurrentBlog = (state) => state.blogs.currentPost;
export const selectBlogDetailStatus = (state) => state.blogs.detailStatus;

export default blogSlice.reducer;