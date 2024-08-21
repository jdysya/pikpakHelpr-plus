import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.js',
      userscript: {
        icon: 'https://www.google.com/s2/favicons?sz=64&domain=mypikpak.com',
        namespace: 'http://tampermonkey.net/',
        match: ['https://mypikpak.com/*'],
        author: 'jdysya',
        grant: ['unsafeWindow', 'GM_xmlhttpRequest'],
        license: 'MIT',
        runAt: 'document-start',
        name: 'pikpak助手plus',
        description: 'pikpak网盘助手的增强版，搭配代理可实现直连下载，支持推送文件夹到aria2中!'
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
    }),
  ],
});
