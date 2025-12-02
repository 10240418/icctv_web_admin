<script setup lang="ts">
import { ref, watch } from "vue";
import type { Admin } from "@/model/admin";
import { useAdminData } from "../useAdmin";

const props = defineProps<{
  visible: boolean;
  mode: "create" | "edit";
  adminData?: Admin;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  created: [];
  updated: [];
  cancel: [];
}>();

const { create, update } = useAdminData();

const formRef = ref();
const formData = ref<{
  id?: number;
  username: string;
  password: string;
  confirmPassword?: string;
}>({
  username: "",
  password: "",
  confirmPassword: "",
});

const isLoading = ref(false);

// 初始化表單數據
watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      isLoading.value = false;
      return;
    }

    if (props.mode === "edit" && props.adminData) {
      formData.value = {
        id: props.adminData.id,
        username: props.adminData.username,
        password: "",
        confirmPassword: "",
      };
    } else if (props.mode === "create") {
      formData.value = {
        username: "",
        password: "",
        confirmPassword: "",
      };
    }
  },
  { immediate: true }
);

const validatePassword = (
  _rule: any,
  value: string,
  callback: (err?: Error) => void
) => {
  if (props.mode === "create" && !value) {
    callback(new Error("請輸入密碼"));
  } else if (props.mode === "edit" && value && value.length < 6) {
    callback(new Error("密碼長度至少6位"));
  } else {
    callback();
  }
};

const validateConfirmPassword = (
  _rule: any,
  value: string,
  callback: (err?: Error) => void
) => {
  if (props.mode === "create" && !value) {
    callback(new Error("請確認密碼"));
  } else if (value && value !== formData.value.password) {
    callback(new Error("兩次輸入的密碼不一致"));
  } else {
    callback();
  }
};

const handleOk = () => {
  if (isLoading.value) return;

  formRef.value
    .validate()
    .then(() => {
      isLoading.value = true;

      if (props.mode === "edit") {
        const updateData: { id: number; username?: string; password?: string } =
          {
            id: formData.value.id!,
          };
        if (formData.value.username !== props.adminData?.username) {
          updateData.username = formData.value.username;
        }
        if (formData.value.password) {
          updateData.password = formData.value.password;
        }
        update(updateData)
          .then(() => {
            emit("update:visible", false);
            emit("updated");
          })
          .catch(() => {
            // 錯誤已在 useAdmin 中處理
          })
          .finally(() => {
            isLoading.value = false;
          });
      } else if (props.mode === "create") {
        create({
          username: formData.value.username,
          password: formData.value.password,
        })
          .then(() => {
            emit("update:visible", false);
            emit("created");
          })
          .catch(() => {
            // 錯誤已在 useAdmin 中處理
          })
          .finally(() => {
            isLoading.value = false;
          });
      }
    })
    .catch(() => {
      isLoading.value = false;
    });
};

const handleCancel = () => {
  emit("update:visible", false);
  emit("cancel");
};
</script>

<template>
  <a-modal
    :open="props.visible"
    :title="props.mode === 'create' ? '新增管理員' : '編輯管理員'"
    :mask-closable="false"
    :confirm-loading="isLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ style: { width: '100px' } }"
    >
      <a-form-item
        label="用戶名"
        name="username"
        :rules="[{ required: true, message: '請輸入用戶名!' }]"
      >
        <a-input
          v-model:value="formData.username"
          :disabled="props.mode === 'edit'"
        />
      </a-form-item>

      <a-form-item
        label="密碼"
        name="password"
        :rules="[{ validator: validatePassword }]"
      >
        <a-input-password
          v-model:value="formData.password"
          :placeholder="props.mode === 'edit' ? '留空則不修改密碼' : '請輸入密碼'"
        />
      </a-form-item>

      <a-form-item
        v-if="props.mode === 'create'"
        label="確認密碼"
        name="confirmPassword"
        :rules="[{ validator: validateConfirmPassword }]"
      >
        <a-input-password
          v-model:value="formData.confirmPassword"
          placeholder="請再次輸入密碼"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>

