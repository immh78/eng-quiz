import { createApp, watch } from 'vue';
import App from './App.vue';
import router from './router';
import { createVuetify } from 'vuetify';
import 'vuetify/styles'; // Vuetify 스타일 가져오기
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css'; // MDI 아이콘 스타일 추가
import { createPinia } from 'pinia';
import persistedState from 'pinia-plugin-persistedstate'; 


const vuetify = createVuetify({
  components,
  directives,
});

router.isReady().then(() => {
  watch(
      () => router.currentRoute.value.path,
      (newPath) => {
          const manifest = document.querySelector('link[rel="manifest"]')
          if (!manifest) return

          const tools = [
              'cw',
              'gw'
          ];

          manifest.href = "";

          for (const tool of tools) {
              if (newPath.includes(`/${tool}`)) {
                  manifest.href = `/eng-quiz/manifests/manifest-${tool}.json?v=` + Date.now();
                  break;
              }
          }

          if (manifest.href === "") {
              manifest.href = '/eng-quiz/manifests/manifest.json?v=' + Date.now();
          }

      },
      { immediate: true }
  )
})

const pinia = createPinia();
pinia.use(persistedState); 

const app = createApp(App);
app.use(vuetify).use(router).use(pinia);
app.mount('#app');
