<script setup>
import { ref } from 'vue';
import { signInWithEmailAndPassword,sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter, useRoute } from 'vue-router';

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const route = useRoute();
const router = useRouter();

async function login() {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);

    // 리디렉트 경로 있으면 해당 페이지로, 없으면 홈으로
    const redirectTo = route.query.redirect || '/';
    router.push(redirectTo);

  } catch (error) {
    console.error('로그인 오류:', error.code);
    switch (error.code) {
      case 'auth/user-not-found':
        alert('등록되지 않은 이메일입니다.');
        break;
      case 'auth/wrong-password':
        alert('비밀번호가 올바르지 않습니다.');
        break;
      case 'auth/invalid-credential':
        alert('이메일 또는 비밀번호가 유효하지 않습니다.');
        break;
      default:
        alert('로그인에 실패했습니다.');
    }
  }
};

async function resetPassword() {
  if (!email.value) {
    alert('이메일을 입력해주세요.');
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email.value);
    alert('비밀번호 재설정 이메일이 발송되었습니다.');
  } catch (error) {
    console.error('비밀번호 재설정 오류:', error.code);
    switch (error.code) {
      case 'auth/user-not-found':
        alert('등록되지 않은 이메일입니다.');
        break;
      case 'auth/invalid-email':
        alert('유효한 이메일 주소를 입력해주세요.');
        break;
      default:
        alert('비밀번호 재설정에 실패했습니다.');
    }
  }
}

function goToRegister() {
  router.push('/register'); // 회원가입 페이지 경로
};
</script>

<template>
  <v-container class="d-flex align-center justify-center fill-height login-container">
    <v-card width="420" class="pa-8 login-card" elevation="3">
      <div class="text-center mb-6">
        <v-icon color="primary" size="64" class="mb-4">mdi-book-open-variant</v-icon>
        <v-card-title class="text-h4 font-weight-bold pa-0 mb-2" style="color: #263238;">영어 단어장</v-card-title>
        <p class="text-body-2" style="color: #757575;">로그인하여 학습을 시작하세요</p>
      </div>

      <v-form @submit.prevent="login()">
        <v-text-field v-model="email" label="이메일" prepend-inner-icon="mdi-email-outline" 
          type="email" variant="outlined" class="mb-3" required />

        <v-text-field v-model="password" label="비밀번호" prepend-inner-icon="mdi-lock-outline"
          :type="showPassword ? 'text' : 'password'" 
          :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showPassword = !showPassword" 
          variant="outlined" 
          class="mb-2"
          required 
          @keydown.enter="login()" />

        <v-btn :loading="loading" color="primary" class="mt-4" type="submit" block size="large">
          <v-icon class="mr-2">mdi-login</v-icon>
          로그인
        </v-btn>
        <v-btn variant="text" class="mt-2" block @click="resetPassword" size="small">
          비밀번호를 잊으셨나요?
        </v-btn>
      </v-form>

      <v-divider class="my-6"></v-divider>

      <div class="text-center">
        <p class="text-body-2 mb-3" style="color: #757575;">계정이 없으신가요?</p>
        <v-btn variant="outlined" color="primary" @click="goToRegister()" block>
          회원가입
        </v-btn>
      </div>
    </v-card>
  </v-container>
</template>

<style scoped>
.login-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.login-card {
  border-radius: 16px;
  background: white;
}

.fill-height {
  min-height: 100vh;
}
</style>
