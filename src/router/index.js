// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Main from '../pages/main.vue';


const routes = [
  { path: '/', redirect: '/cw' },
  { path: '/cw', component: Main, comment: '채원 영어 단어장', icon: 'mdi-book' },
  { path: '/gw', component: Main, comment: '경원 영어 단어장', icon: 'mdi-book' },
  ]

const router = createRouter({
  history: createWebHashHistory('/eng-quiz/'), // hash 모드 사용
  routes
})

export default router
