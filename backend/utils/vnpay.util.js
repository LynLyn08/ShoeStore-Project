'use strict';

const qs = require('qs');
const crypto = require('crypto');
const moment = require('moment');

/**
 * Sắp xếp các key của object theo thứ tự alphabet.
 * Đây là yêu cầu bắt buộc của VNPAY để tạo checksum.
 * @param {object} obj - Object cần sắp xếp
 * @returns {object} - Object đã được sắp xếp
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        // Chuyển đổi giá trị thành chuỗi trước khi mã hóa
        const value = obj[str[key]];
        const encodedValue = encodeURIComponent(String(value)).replace(/%20/g, "+");
        sorted[str[key]] = encodedValue;
    }
    return sorted;
}


/**
 * Tạo URL thanh toán VNPAY.
 * @param {string} ipAddr - Địa chỉ IP của khách hàng
 * @param {number} amount - Tổng số tiền thanh toán
 * @param {string} orderId - Mã đơn hàng duy nhất
 * @param {string} returnUrl - URL VNPAY sẽ trả về sau khi thanh toán
 * @param {string} orderInfo - Thông tin đơn hàng
 * @returns {string} - URL thanh toán VNPAY
 */
function createPaymentUrl(ipAddr, amount, orderId, returnUrl, orderInfo = 'Thanh toan don hang') {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const tmnCode = process.env.VNPAY_TMN_CODE;
    const secretKey = process.env.VNPAY_HASH_SECRET;
    let vnpUrl = process.env.VNPAY_URL;

    const createDate = moment(new Date()).format('YYYYMMDDHHmmss');

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = orderInfo + ' ' + orderId;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPAY yêu cầu nhân 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    const signData = qs.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
}

module.exports = {
    createPaymentUrl,
    sortObject
};