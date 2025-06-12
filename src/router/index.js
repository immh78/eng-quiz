// src/router/index.js 또는 main.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { isLoggedIn } from '../config/authGuard';

import Main from '../pages/main.vue';
import Login from '../pages/Login.vue';
import Register from '../pages/Register.vue';

const routes = [
  { path: '/', redirect: '/cw' },
  {
    path: '/cw', component: Main, comment: '채원 영어 단어장', icon: 'mdi-book',
    meta: { requiresAuth: true }
  },
  {
    path: '/gw', component: Main, comment: '경원 영어 단어장', icon: 'mdi-book',
    meta: { requiresAuth: true }
  },
  {
    path: '/login', component: Login, comment: '로그인', icon: 'mdi-login',
    meta: { requiresAuth: false }

  },
  {
    path: '/register', component: Register, comment: '회원등록', icon: 'mdi-account-plus',
    meta: { requiresAuth: false }
  },
]

const router = createRouter({
  history: createWebHashHistory('/eng-quiz/'), // hash 모드 사용
  routes
})

router.beforeEach(async (to, from, next) => {
  // 로그인 필요
  if (to.meta.requiresAuth && !isLoggedIn()) {
    return next({ path: '/login', query: { redirect: to.fullPath } });
  }

  next(); // 통과
});

export default router
