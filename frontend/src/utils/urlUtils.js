// src/utils/urlUtils.js

export const resolveAvatarUrl = (avatarPath) => {
  // Nếu không có avatar, trả về ảnh mặc định
  if (!avatarPath) {
    return '/default-avatar.png'; // Đảm bảo file này có trong thư mục /public
  }

  // Nếu đã là URL đầy đủ (từ Google, Facebook), trả về chính nó
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }

  // Nếu là đường dẫn tương đối, nối với Base URL của backend
  const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  // Đảm bảo đường dẫn bắt đầu bằng dấu gạch chéo
  const correctedPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${backendUrl}${correctedPath}`;
};