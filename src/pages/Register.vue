<script setup>
import { ref } from 'vue';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useRouter } from 'vue-router';
import { database, ref as firebaseRef, update } from "../config/firebase";

const email = ref('');
const password = ref('');
const name = ref('');
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');
const router = useRouter();

const register = async () => {
    try {
        loading.value = true;
        errorMessage.value = '';

        const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
        const user = userCredential.user;

        saveUser(user.uid);
        alert(`환영합니다, ${user.email} 님!`);
        router.push('/login');
    } catch (error) {
        console.error(error.code, error.message);
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMessage.value = '이미 등록된 이메일입니다.';
                break;
            case 'auth/invalid-email':
                errorMessage.value = '유효하지 않은 이메일입니다.';
                break;
            case 'auth/weak-password':
                errorMessage.value = '비밀번호는 6자 이상이어야 합니다.';
                break;
            default:
                errorMessage.value = '회원가입에 실패했습니다.';
        }
    } finally {
        loading.value = false;
    }
};


async function saveUser(uid) {
    const data = {
        [uid]: {
            name: name.value,
            email: email.value
        }
    };

    const dbRef = firebaseRef(database, 'user');
    await update(dbRef, data)
        .then(() => {
            console.log("User data saved successfully.");
        })
        .catch((error) => {
            console.error("Error saving user data:", error);
        });
}
</script>

<template>
    <v-container class="d-flex align-center justify-center fill-height register-container">
        <v-card width="420" class="pa-8 register-card" elevation="3">
            <div class="text-center mb-6">
                <v-icon color="primary" size="64" class="mb-4">mdi-account-plus</v-icon>
                <v-card-title class="text-h4 font-weight-bold pa-0 mb-2" style="color: #263238;">회원가입</v-card-title>
                <p class="text-body-2" style="color: #757575;">새로운 계정을 만드세요</p>
            </div>

            <v-form @submit.prevent="register">
                <v-text-field v-model="name" label="이름" prepend-inner-icon="mdi-account-outline" 
                    type="text" variant="outlined" class="mb-3" required />

                <v-text-field v-model="email" label="이메일" prepend-inner-icon="mdi-email-outline" 
                    type="email" variant="outlined" class="mb-3" required />

                <v-text-field v-model="password" label="비밀번호" prepend-inner-icon="mdi-lock-outline"
                    :type="showPassword ? 'text' : 'password'" 
                    :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                    @click:append-inner="showPassword = !showPassword" 
                    variant="outlined"
                    class="mb-2"
                    required />

                <v-btn :loading="loading" color="primary" class="mt-4" type="submit" block size="large">
                    <v-icon class="mr-2">mdi-account-plus</v-icon>
                    회원가입
                </v-btn>
            </v-form>

            <v-alert v-if="errorMessage" type="error" class="mt-4" variant="tonal" density="compact">
                <v-icon class="mr-2">mdi-alert-circle</v-icon>
                {{ errorMessage }}
            </v-alert>
        </v-card>
    </v-container>
</template>

<style scoped>
.register-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
}

.register-card {
    border-radius: 16px;
    background: white;
}

.fill-height {
    min-height: 100vh;
}
</style>
