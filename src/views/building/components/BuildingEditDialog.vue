<script setup lang="ts">
import { ref, watch } from "vue";
import type { Building } from "@/model/building";
import { useBuildingData } from "../useBuilding";

const props = defineProps<{
  visible: boolean;
  mode: "create" | "edit";
  buildingData?: Building;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  created: [];
  updated: [];
  cancel: [];
}>();

const { create, update } = useBuildingData();

const formRef = ref();
const formData = ref<{
  id?: number;
  ismartid: string;
  name: string;
  remark: string;
}>({
  ismartid: "",
  name: "",
  remark: "",
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

    if (props.mode === "edit" && props.buildingData) {
      formData.value = {
        id: props.buildingData.id,
        ismartid: props.buildingData.ismartid,
        name: props.buildingData.name,
        remark: props.buildingData.remark || "",
      };
    } else if (props.mode === "create") {
      formData.value = {
        ismartid: "",
        name: "",
        remark: "",
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
        update(
          {
            ismartid: formData.value.ismartid,
            name: formData.value.name,
            remark: formData.value.remark || undefined,
          },
          formData.value.id!
        )
          .then(() => {
            emit("update:visible", false);
            emit("updated");
          })
          .catch(() => {
            // 錯誤已在 useBuilding 中處理
          })
          .finally(() => {
            isLoading.value = false;
          });
      } else if (props.mode === "create") {
        create({
          ismartid: formData.value.ismartid,
          name: formData.value.name,
          remark: formData.value.remark || undefined,
        })
          .then(() => {
            emit("update:visible", false);
            emit("created");
          })
          .catch(() => {
            // 錯誤已在 useBuilding 中處理
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
    :title="props.mode === 'create' ? '新增建築' : '編輯建築'"
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
        label="iSmart ID"
        name="ismartid"
        :rules="[{ required: true, message: '請輸入iSmart ID!' }]"
      >
        <a-input v-model:value="formData.ismartid" />
      </a-form-item>

      <a-form-item
        label="建築名稱"
        name="name"
        :rules="[{ required: true, message: '請輸入建築名稱!' }]"
      >
        <a-input v-model:value="formData.name" />
      </a-form-item>

      <a-form-item
        label="備註"
        name="remark"
      >
        <a-textarea
          v-model:value="formData.remark"
          :rows="3"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped></style>

