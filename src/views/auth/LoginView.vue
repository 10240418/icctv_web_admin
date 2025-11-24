<script setup lang="ts">
import { reactive } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "../../pinia/useAuthStore";

const formState = reactive({
  username: "",
  password: "",
});

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const handleLogin = async () => {
  authStore.setToken("mock-token");
  authStore.setUser({ username: formState.username, roles: ["admin"] });
  const redirect = (route.query.redirect as string) || "/dashboard";
  await router.push(redirect);
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

