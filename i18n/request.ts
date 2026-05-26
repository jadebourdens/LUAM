import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing'; // <--- Thêm dòng này vào đây

export default getRequestConfig(async ({ requestLocale }) => {
  // Đợi để lấy locale từ request
  let locale = await requestLocale;

  // Kiểm tra locale hợp lệ dựa trên file routing.ts
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // Đường dẫn import message phải quay ngược ra ngoài 1 cấp 
    // vì file này nằm trong thư mục i18n/
    messages: (await import(`../messages/${locale}.json`)).default
  };
});