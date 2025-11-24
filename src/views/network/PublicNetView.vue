<script setup lang="ts">
import { ref } from "vue";

const formState = ref({
  external_ip: "120.33.41.90",
});

const onSubmit = () => {
  // TODO: 調用 PublicNetApi
  // eslint-disable-next-line no-console
  console.log("提交公網配置", formState.value);
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
      >保存配置</a-button>
    </a-form>
  </a-card>
</template>

