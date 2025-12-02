<script setup lang="ts">
import { ref, watch } from "vue";
import type { Nvr } from "@/model/nvr";
import { useNvrData } from "../useNvr";

const props = defineProps<{
  visible: boolean;
  mode: "create" | "edit";
  nvrData?: Nvr;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  created: [];
  updated: [];
  cancel: [];
}>();

const { create, update } = useNvrData();

const formRef = ref();
const formData = ref<{
  id?: number;
  name: string;
  url: string;
  building_id: number | null;
}>({
  name: "",
  url: "",
  building_id: null,
});

const isLoading = ref(false);

// 初始化表單資料
watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      isLoading.value = false;
      return;
    }

    if (props.mode === "edit" && props.nvrData) {
      formData.value = {
        id: props.nvrData.id,
        name: props.nvrData.name,
        url: props.nvrData.url,
        building_id: props.nvrData.building_id,
      };
    } else if (props.mode === "create") {
      formData.value = {
        name: "",
        url: "",
        building_id: null,
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
          name?: string;
          url?: string;
          building_id?: number;
        } = {};

        if (formData.value.name !== props.nvrData?.name) {
          updateData.name = formData.value.name;
        }
        if (formData.value.url !== props.nvrData?.url) {
          updateData.url = formData.value.url;
        }
        if (formData.value.building_id !== props.nvrData?.building_id) {
          if (formData.value.building_id != null) {
            updateData.building_id = formData.value.building_id;
          }
        }

        update(updateData, formData.value.id!)
          .then(() => {
            emit("update:visible", false);
            emit("updated");
          })
          .catch(() => {
            // 錯誤已在 useNvr 中處理
          })
          .finally(() => {
            isLoading.value = false;
          });
      } else if (props.mode === "create") {
        create({
          name: formData.value.name,
          url: formData.value.url,
          building_id: formData.value.building_id!,
        })
          .then(() => {
            emit("update:visible", false);
            emit("created");
          })
          .catch(() => {
            // 錯誤已在 useNvr 中處理
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
    :title="props.mode === 'create' ? '新增 NVR' : '編輯 NVR'"
    :mask-closable="false"
    :confirm-loading="isLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ style: { width: '120px' } }"
    >
      <a-form-item
        label="名稱"
        name="name"
        :rules="[{ required: true, message: '請輸入 NVR 名稱！' }]"
      >
        <a-input v-model:value="formData.name" />
      </a-form-item>

      <a-form-item
        label="訪問地址"
        name="url"
        :rules="[{ required: true, message: '請輸入訪問地址 (IP:Port)！' }]"
      >
        <a-input
          v-model:value="formData.url"
          placeholder="192.168.1.100:8081"
        />
      </a-form-item>

      <a-form-item
        label="建築 ID"
        name="building_id"
        :rules="[{ required: true, message: '請輸入建築 ID！' }]"
      >
        <a-input-number
          v-model:value="formData.building_id"
          :min="1"
          style="width: 100%"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>


