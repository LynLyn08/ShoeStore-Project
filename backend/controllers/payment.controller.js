// backend/controllers/payment.controller.js
'use strict';

const db = require('../models');
const { sortObject } = require('../utils/vnpay.util');
const crypto = require('crypto');
const qs = require('qs');

/**
 * @desc    Xử lý kết quả trả về từ VNPAY (IPN) - NÂNG CẤP
 * @route   GET /api/payment/vnpay_ipn
 */
exports.vnpayIpnHandler = async (req, res) => {
    try {
        let vnp_Params = req.query;
        let secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNPAY_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const rspCode = vnp_Params['vnp_ResponseCode'];
            
            // THAY ĐỔI QUAN TRỌNG: Tìm đơn hàng trong cả 2 bảng
            let order = await db.Order.findByPk(orderId);
            if (!order) {
                order = await db.GuestOrder.findByPk(orderId);
            }
            // HẾT THAY ĐỔI

            if (!order) {
                return res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }

            if (order.PaymentStatus !== 'Pending') {
                 return res.status(200).json({ RspCode: '02', Message: 'Order already confirmed' });
            }

            if (rspCode === '00') {
                await order.update({
                    PaymentStatus: 'Paid',
                    PaymentTxnRef: vnp_Params['vnp_TransactionNo'],
                    PaidAt: new Date()
                });
            } else {
                await order.update({ PaymentStatus: 'Failed' });
            }
            return res.status(200).json({ RspCode: '00', Message: 'Success' });
        } else {
            return res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }
    } catch (error) {
        console.error('VNPAY IPN Error:', error);
        return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};