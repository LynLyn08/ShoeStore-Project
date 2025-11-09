// frontend/src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import cartReducer from './cartSlice';
import profileReducer from './profileSlice';
import homeReducer from './homeSlice';
import productReducer from './productSlice'; 
import productDetailReducer from './productDetailSlice';
import checkoutReducer from './checkoutSlice';
import blogReducer from './blogSlice';
import contactReducer from './contactSlice';
import guestOrderReducer from './guestOrderSlice';
//Phần admin
import adminUsersReducer from './adminUsersSlice';
import adminProductsReducer from './adminProductsSlice';
import dashboardReducer from './dashboardSlice';
import adminCategoriesReducer from './adminCategoriesSlice';
import adminOrdersReducer from './adminOrdersSlice';
import adminBlogsReducer from './adminBlogsSlice';
import adminCouponsReducer from './adminCouponsSlice';
import adminReviewsReducer from './adminReviewsSlice';
import adminPaymentMethodsReducer from './adminPaymentMethodsSlice';
const store = configureStore({
  reducer: {
    user: userReducer,
    cart: cartReducer,
    profile: profileReducer,
    home: homeReducer,
    products: productReducer, 
    productDetail: productDetailReducer,
    checkout: checkoutReducer,
    blogs: blogReducer,
    contact: contactReducer,
    guestOrder: guestOrderReducer,
    //Phần admin
    adminUsers: adminUsersReducer,
    adminProducts: adminProductsReducer,
    dashboard: dashboardReducer,
    adminCategories: adminCategoriesReducer,
    adminPaymentMethods: adminPaymentMethodsReducer,
    adminOrders: adminOrdersReducer,
    adminBlogs: adminBlogsReducer,
    adminCoupons: adminCouponsReducer,
    adminReviews: adminReviewsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;