<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";
import { PublicNetApi } from "@/httpapis/api";

const formState = ref({
  external_ip: "",
});

const isSubmitting = ref(false);

const onSubmit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    await PublicNetApi.update({
      external_ip: formState.value.external_ip.trim(),
    });
    message.success("公網配置已更新");
  } catch (error: any) {
    const backendError = error?.response?.data?.error;
    message.error(backendError || "更新失敗，請稍後再試");
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <a-card>
    <template #title>
      <div>
        <p class="font-medium">公網配置</p>
        <p class="text-xs text-muted">Public Network Config</p>
      </div>
    </template>
    <p class="text-sm text-muted">
      `/api/publicnet/config` 用於統一管理外部訪問 IP。提交後後端將寫入 OrangePi 節點配置文件。
    </p>
    <a-form
      class="mt-6 max-w-xl space-y-4"
      layout="vertical"
      :model="formState"
      @finish="onSubmit"
    >
      <a-form-item
        label="公網 IP"
        name="external_ip"
        :rules="[{ required: true, message: '請輸入公網 IP' }]"
      >
        <a-input
          v-model:value="formState.external_ip"
          placeholder="例如 120.33.41.90"
        />
      </a-form-item>
      <a-button
        type="primary"
        html-type="submit"
        :loading="isSubmitting"
      >保存配置</a-button>
    </a-form>
  </a-card>
</template>

