'use strict';

const vietnameseNormalize = (text) => {
    if (typeof text !== 'string') return '';
    return text.toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng gạch nối
        .replace(/[^a-z0-9-]/g, ''); // Loại bỏ ký tự đặc biệt
};

module.exports = {
    vietnameseNormalize
};