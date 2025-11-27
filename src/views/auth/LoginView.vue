<script setup lang="ts">
import { reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { message } from 'ant-design-vue';
import { useAuthStore } from '../../pinia/useAuthStore';
import { AuthApi, HealthApi } from '@/httpapis/api';

const formState = reactive({
  username: '',
  password: '',
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

onMounted(async () => {
  try {
    await HealthApi.check();
  } catch {
    message.error('後端服務不可用，請稍後再試');
  }
});

const handleLogin = async () => {
  try {
    const response = await AuthApi.login({
      username: formState.username,
      password: formState.password,
    });

    if (!response.data.success) {
      message.error(response.data.error || '登入失敗，請檢查帳號或密碼');
      return;
    }

    const { accessToken, expiresAt } = response.data.data;

    authStore.setToken(accessToken);
    authStore.setUser({ username: formState.username, roles: ['admin'] });

    localStorage.setItem('icctv-token', accessToken);
    localStorage.setItem('icctv-token-expires-at', expiresAt);

    const redirect = (route.query.redirect as string) || '/dashboard';
  await router.push(redirect);
  } catch (error: any) {
    const backendError = error?.response?.data?.error;
    message.error(backendError || '登入失敗，請稍後再試');
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-surface">
    <a-card class="w-full max-w-md bg-surface/90">
      <div class="text-center">
        <h1 class="text-2xl font-semibold text-foreground">Icctv 後台登入</h1>
        <p class="text-xs text-muted mt-1">Icctv Backend Login</p>
      </div>
      <a-form
        class="mt-8 space-y-4"
        layout="vertical"
        :model="formState"
        @finish="handleLogin"
      >
        <a-form-item
          label="用戶名"
          name="username"
          :rules="[{ required: true, message: '請輸入用戶名' }]"
        >
          <a-input
            v-model:value="formState.username"
            placeholder="admin"
          />
        </a-form-item>
        <a-form-item
          label="密碼"
          name="password"
          :rules="[{ required: true, message: '請輸入密碼' }]"
        >
          <a-input-password
            v-model:value="formState.password"
            placeholder="••••••••"
          />
        </a-form-item>
        <a-button
          type="primary"
          html-type="submit"
          block
        >登入</a-button>
      </a-form>
    </a-card>
  </div>
</template>

