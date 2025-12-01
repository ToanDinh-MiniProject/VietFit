import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'VietFit - Theo dõi Calo',
        short_name: 'VietFit',
        description: 'Ứng dụng hỗ trợ giảm cân cho người Việt',
        theme_color: '#059669', // Màu xanh Emerald chủ đạo của app
        background_color: '#ffffff',
        display: 'standalone', // Quan trọng: làm mất thanh địa chỉ web
        orientation: 'portrait', // Khóa màn hình dọc
        icons: [
          {
            src: 'logo_app.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo_app.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
});