<script setup lang="ts">
import { ref, watch } from "vue";
import type { Device } from "@/model/device";
import { useOrangePiData } from "../useOrangePi";

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

const { create, update, remoteUpdatePorts } = useOrangePiData();

const formRef = ref();
const formData = ref<{
  id?: number;
  ismartid: string;
  name: string;
  icctv_auth_service_remote_port: number | undefined;
  ssh_remote_port: number | undefined;
  user_channels: number[];
  all_channels: number[];
}>({
  ismartid: "",
  name: "",
  icctv_auth_service_remote_port: undefined,
  ssh_remote_port: undefined,
  user_channels: [],
  all_channels: [],
});

// 频道选项 (1-8)，用于多选下拉框
const channelOptions = Array.from({ length: 8 }, (_, i) => ({
  label: `Channel ${i + 1}`,
  value: i + 1,
}));

// 处理全部频道的选择逻辑：点击某个频道时自动选中 1 到该频道的所有频道
const handleAllChannelsChange = (values: number[]) => {
  if (values.length === 0) {
    formData.value.all_channels = [];
    return;
  }
  // 找到最大的频道号，自动选中 1 到该频道
  const maxChannel = Math.max(...values);
  formData.value.all_channels = Array.from(
    { length: maxChannel },
    (_, i) => i + 1
  );
};

const isLoading = ref(false);

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
        user_channels: props.deviceData.user_channels || [],
        all_channels: props.deviceData.all_channels || [],
      };
    } else {
      formData.value = {
        ismartid: "",
        name: "",
        icctv_auth_service_remote_port: undefined,
        ssh_remote_port: undefined,
        user_channels: [],
        all_channels: [],
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
          user_channels?: number[];
          all_channels?: number[];
        } = {};

        // 检查端口是否有变化
        const authPortChanged =
          formData.value.icctv_auth_service_remote_port !==
          props.deviceData?.icctv_auth_service_remote_port;
        const sshPortChanged =
          formData.value.ssh_remote_port !== props.deviceData?.ssh_remote_port;
        const portsChanged = authPortChanged || sshPortChanged;

        if (formData.value.ismartid !== props.deviceData?.ismartid) {
          updateData.ismartid = formData.value.ismartid;
        }
        if (formData.value.name !== props.deviceData?.name) {
          updateData.name = formData.value.name;
        }
        if (authPortChanged) {
          updateData.icctv_auth_service_remote_port =
            formData.value.icctv_auth_service_remote_port;
        }
        if (sshPortChanged) {
          updateData.ssh_remote_port = formData.value.ssh_remote_port;
        }
        if (
          JSON.stringify(formData.value.user_channels?.sort()) !==
          JSON.stringify(props.deviceData?.user_channels?.sort() || [])
        ) {
          updateData.user_channels = formData.value.user_channels;
        }
        if (
          JSON.stringify(formData.value.all_channels?.sort()) !==
          JSON.stringify(props.deviceData?.all_channels?.sort() || [])
        ) {
          updateData.all_channels = formData.value.all_channels;
        }

        // 如果端口有变化，先调用远程更新FRPC端口（使用旧端口连接）
        // 远程更新成功后，后端会自动更新数据库中的端口
        // 然后前端再更新其他字段（如果有的话）
        const doUpdate = async () => {
          if (
            portsChanged &&
            formData.value.icctv_auth_service_remote_port &&
            formData.value.ssh_remote_port
          ) {
            // 先远程更新FRPC端口（此时数据库还是旧端口，后端会用旧端口连接）
            // 远程更新成功后，后端会自动更新数据库中的端口
            await remoteUpdatePorts(
              formData.value.id!,
              formData.value.ssh_remote_port,
              formData.value.icctv_auth_service_remote_port
            );
            // 远程更新成功后，从 updateData 中移除端口字段（后端已更新）
            delete updateData.icctv_auth_service_remote_port;
            delete updateData.ssh_remote_port;
          }
          // 如果还有其他字段需要更新，再调用 update
          if (Object.keys(updateData).length > 0) {
            await update(updateData, formData.value.id!);
          }
        };

        doUpdate()
          .then(() => {
            emit("update:visible", false);
            emit("updated");
          })
          .catch(() => {})
          .finally(() => {
            isLoading.value = false;
          });
      } else {
        create({
          ismartid: formData.value.ismartid,
          name: formData.value.name,
          icctv_auth_service_remote_port:
            formData.value.icctv_auth_service_remote_port!,
          ssh_remote_port: formData.value.ssh_remote_port!,
          user_channels:
            formData.value.user_channels.length > 0
              ? formData.value.user_channels
              : undefined,
          all_channels:
            formData.value.all_channels.length > 0
              ? formData.value.all_channels
              : undefined,
        })
          .then(() => {
            emit("update:visible", false);
            emit("created");
          })
          .catch(() => {})
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
    :title="props.mode === 'create' ? '新增 香橙派' : '編輯 香橙派'"
    :mask-closable="false"
    :confirm-loading="isLoading"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ style: { width: '140px' } }"
    >
      <a-form-item
        label="iSmart ID"
        name="ismartid"
        :rules="[{ required: true, message: '請輸入 iSmart ID' }]"
      >
        <a-input v-model:value="formData.ismartid" />
      </a-form-item>

      <a-form-item
        label="設備名稱"
        name="name"
        :rules="[{ required: true, message: '請輸入設備名稱' }]"
      >
        <a-input v-model:value="formData.name" />
      </a-form-item>

      <a-form-item
        label="認證服務端口"
        name="icctv_auth_service_remote_port"
        :rules="[
          { required: true, message: '請輸入認證服務端口' },
          { type: 'number', min: 1, max: 65535, message: '端口需在 1-65535 之間' },
        ]"
      >
        <a-input-number
          v-model:value="formData.icctv_auth_service_remote_port"
          :min="1"
          :max="65535"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="SSH 遠程端口"
        name="ssh_remote_port"
        :rules="[
          { required: true, message: '請輸入 SSH 遠程端口' },
          { type: 'number', min: 1, max: 65535, message: '端口需在 1-65535 之間' },
        ]"
      >
        <a-input-number
          v-model:value="formData.ssh_remote_port"
          :min="1"
          :max="65535"
          style="width: 100%"
        />
      </a-form-item>

      <a-form-item
        label="所有頻道"
        name="all_channels"
        :rules="[]"
      >
        <a-select
          :value="formData.all_channels"
          mode="multiple"
          placeholder="請選擇頻道 (點擊某頻道自動選中 1 到該頻道)"
          style="width: 100%"
          :options="channelOptions"
          @change="handleAllChannelsChange"
        />
      </a-form-item>

      <a-form-item
        label="用戶頻道"
        name="user_channels"
        :rules="[]"
      >
        <a-select
          v-model:value="formData.user_channels"
          mode="multiple"
          placeholder="請選擇用戶可訪問的頻道"
          style="width: 100%"
          :options="channelOptions"
        />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
</style>



