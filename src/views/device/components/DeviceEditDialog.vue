<script setup lang="ts">
import { ref, watch } from "vue";
import type { Device } from "@/model/device";
import { useDeviceData } from "../useDevice";

const props = defineProps<{
  visible: boolean;
  mode: "create" | "edit";
  deviceData?: Device;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  created: [];
  updated: [];
  cancel: [];
}>();

const { create, update } = useDeviceData();

const formRef = ref();
const formData = ref<{
  id?: number;
  ismartid: string;
  name: string;
  icctv_auth_service_remote_port: number | undefined;
  ssh_remote_port: number | undefined;
  is_active: boolean;
}>({
  ismartid: "",
  name: "",
  icctv_auth_service_remote_port: undefined,
  ssh_remote_port: undefined,
  is_active: true,
});

const isLoading = ref(false);

// 初始化表单数据
watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      isLoading.value = false;
      return;
    }

    if (props.mode === "edit" && props.deviceData) {
      formData.value = {
        id: props.deviceData.id,
        ismartid: props.deviceData.ismartid,
        name: props.deviceData.name,
        icctv_auth_service_remote_port:
          props.deviceData.icctv_auth_service_remote_port,
        ssh_remote_port: props.deviceData.ssh_remote_port,
        is_active: props.deviceData.is_active,
      };
    } else if (props.mode === "create") {
      formData.value = {
        ismartid: "",
        name: "",
        icctv_auth_service_remote_port: undefined,
        ssh_remote_port: undefined,
        is_active: true,
      };
    }
  },
  { immediate: true }
);

const handleOk = () => {
  if (isLoading.value) return;

  formRef.value
    .validate()
    .then(() => {
      isLoading.value = true;

      if (props.mode === "edit") {
        const updateData: {
          ismartid?: string;
          name?: string;
          icctv_auth_service_remote_port?: number;
          ssh_remote_port?: number;
          is_active?: boolean;
        } = {};
        if (formData.value.ismartid !== props.deviceData?.ismartid) {
          updateData.ismartid = formData.value.ismartid;
        }
        if (formData.value.name !== props.deviceData?.name) {
          updateData.name = formData.value.name;
        }
        if (
          formData.value.icctv_auth_service_remote_port !==
          props.deviceData?.icctv_auth_service_remote_port
        ) {
          updateData.icctv_auth_service_remote_port =
            formData.value.icctv_auth_service_remote_port;
        }
        if (
          formData.value.ssh_remote_port !== props.deviceData?.ssh_remote_port
        ) {
          updateData.ssh_remote_port = formData.value.ssh_remote_port;
        }
        if (formData.value.is_active !== props.deviceData?.is_active) {
          updateData.is_active = formData.value.is_active;
        }
        update(updateData, formData.value.id!)
          .then(() => {
            emit("update:visible", false);
            emit("updated");
          })
          .catch(() => {
            // 錯誤已在 useDevice 中處理
          })
          .finally(() => {
            isLoading.value = false;
          });
      } else if (props.mode === "create") {
        create({
          ismartid: formData.value.ismartid,
          name: formData.value.name,
          icctv_auth_service_remote_port:
            formData.value.icctv_auth_service_remote_port!,
          ssh_remote_port: formData.value.ssh_remote_port!,
          is_active: formData.value.is_active,
        })
          .then(() => {
            emit("update:visible", false);
            emit("created");
          })
          .catch(() => {
            // 錯誤已在 useDevice 中處理
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
    :title="props.mode === 'create' ? '新增設備' : '編輯設備'"
    :mask-closable="false"
    :confirm-loading="isLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ style: { width: '150px' } }"
    >
      <a-form-item
        label="iSmart ID"
        name="ismartid"
        :rules="[{ required: true, message: '請輸入iSmart ID!' }]"
      >
        <a-input v-model:value="formData.ismartid" />
      </a-form-item>

      <a-form-item
        label="設備名稱"
        name="name"
        :rules="[{ required: true, message: '請輸入設備名稱!' }]"
      >
        <a-input v-model:value="formData.name" />
      </a-form-item>

      <a-form-item
        label="認證服務端口"
        name="icctv_auth_service_remote_port"
        :rules="[{ required: true, message: '請輸入認證服務端口!' }, { type: 'number', min: 1, max: 65535, message: '端口範圍1-65535' }]"
      >
        <a-input-number
          v-model:value="formData.icctv_auth_service_remote_port"
          :min="1"
          :max="65535"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="SSH端口"
        name="ssh_remote_port"
        :rules="[{ required: true, message: '請輸入SSH端口!' }, { type: 'number', min: 1, max: 65535, message: '端口範圍1-65535' }]"
      >
        <a-input-number
          v-model:value="formData.ssh_remote_port"
          :min="1"
          :max="65535"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="是否激活"
        name="is_active"
      >
        <a-switch v-model:checked="formData.is_active" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>

