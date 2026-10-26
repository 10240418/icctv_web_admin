<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { ReloadOutlined } from "@ant-design/icons-vue";
import type { Device } from "@/model/device";
import type { Building } from "@/model/building";
import { AuthApi, BuildingApi, OrangePiRemoteApi } from "@/httpapis/api";
import { useOrangePiData } from "../useOrangePi";
import { catalogueChannels, channelLabel } from "../channelCatalogue";
import { importErrorMessage } from "../rtspGroupImport";

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
const syncedDevice = ref<Device>();
const isSyncingChannels = ref(false);
const channelSyncError = ref("");
let syncVersion = 0;

const syncChannels = async () => {
  const device = props.deviceData;
  if (props.mode !== "edit" || !device || !props.visible) return;
  const version = ++syncVersion;
  isSyncingChannels.value = true;
  channelSyncError.value = "";
  try {
    const response = await AuthApi.publicToken({
      ismartid: device.ismartids?.[0] || device.ismartid,
      is_staff: true,
    });
    if (version !== syncVersion) return;
    const token = response.data.data.orangepis
      .find((item) => item.orangepi_id === device.id)?.token;
    if (!token) throw new Error("未找到設備 Token");
    const result = await OrangePiRemoteApi.syncChannels(device.id, token);
    if (version === syncVersion) syncedDevice.value = result.data.data;
  } catch (error) {
    if (version === syncVersion) {
      channelSyncError.value = `同步頻道失敗：${importErrorMessage(error)}`;
    }
  } finally {
    if (version === syncVersion) isSyncingChannels.value = false;
  }
};

const formRef = ref();
const formData = ref<{
  id?: number;
  ismartids: string[];
  name: string;
  icctv_auth_service_remote_port: number | undefined;
  ssh_remote_port: number | undefined;
  user_channels: number[];
  all_channels: number[];
  channel_remarks: Record<string, string>;
}>({
  ismartids: [],
  name: "",
  icctv_auth_service_remote_port: undefined,
  ssh_remote_port: undefined,
  user_channels: [],
  all_channels: [],
  channel_remarks: {},
});

// Use the device catalogue without a fixed channel count or synthetic ranges.
const channelOptions = computed(() => {
  const channels = new Set([
    ...(props.deviceData?.all_channels || []),
    ...(props.deviceData?.user_channels || []),
    ...catalogueChannels(syncedDevice.value || props.deviceData),
    ...formData.value.all_channels,
    ...formData.value.user_channels,
  ]);

  return Array.from(channels)
    .filter((channel) => Number.isInteger(channel) && channel > 0)
    .sort((left, right) => left - right)
    .map((channel) => ({
      label: channelLabel(syncedDevice.value || props.deviceData || {}, channel),
      value: channel,
    }));
});

const compactChannelRemarks = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value.trim()] as const)
      .filter(([, value]) => value !== "")
  );

const isLoading = ref(false);
const buildings = ref<Building[]>([]);
const isLoadingBuildings = ref(false);

const loadBuildings = async () => {
  isLoadingBuildings.value = true;
  try {
    const response = await BuildingApi.list();
    buildings.value = response.data.data || [];
  } catch (error: any) {
    message.error(`加載大廈失敗: ${error.response?.data?.error || error.message}`);
  } finally {
    isLoadingBuildings.value = false;
  }
};

watch(
  () => props.visible,
  () => {
    if (!props.visible) {
      syncVersion++;
      isSyncingChannels.value = false;
      isLoading.value = false;
      return;
    }
    syncedDevice.value = undefined;
    channelSyncError.value = "";

    if (props.mode === "edit" && props.deviceData) {
      formData.value = {
        id: props.deviceData.id,
        ismartids:
          props.deviceData.ismartids?.length > 0
            ? [...props.deviceData.ismartids]
            : [props.deviceData.ismartid].filter(Boolean),
        name: props.deviceData.name,
        icctv_auth_service_remote_port:
          props.deviceData.icctv_auth_service_remote_port,
        ssh_remote_port: props.deviceData.ssh_remote_port,
        user_channels: [...(props.deviceData.user_channels || [])],
        all_channels: [...(props.deviceData.all_channels || [])],
        channel_remarks: { ...(props.deviceData.channel_remarks || {}) },
      };
    } else {
      formData.value = {
        ismartids: [],
        name: "",
        icctv_auth_service_remote_port: undefined,
        ssh_remote_port: undefined,
        user_channels: [],
        all_channels: [],
        channel_remarks: {},
      };
    }
    loadBuildings();
    void syncChannels();
  },
  { immediate: true }
);

const handleOk = () => {
  if (isLoading.value || isSyncingChannels.value) return;

  formRef.value
    .validate()
    .then(() => {
      isLoading.value = true;

      if (props.mode === "edit") {
        const updateData: {
          ismartids?: string[];
          name?: string;
          icctv_auth_service_remote_port?: number;
          ssh_remote_port?: number;
          user_channels?: number[];
          all_channels?: number[];
          channel_remarks?: Record<string, string>;
        } = {};

        // 检查端口是否有变化
        const authPortChanged =
          formData.value.icctv_auth_service_remote_port !==
          props.deviceData?.icctv_auth_service_remote_port;
        const sshPortChanged =
          formData.value.ssh_remote_port !== props.deviceData?.ssh_remote_port;
        const portsChanged = authPortChanged || sshPortChanged;

        const previousISmartIDs = props.deviceData?.ismartids?.length
          ? props.deviceData.ismartids
          : [props.deviceData?.ismartid].filter(Boolean) as string[];
        if (
          JSON.stringify([...formData.value.ismartids].sort()) !==
          JSON.stringify([...previousISmartIDs].sort())
        ) {
          updateData.ismartids = formData.value.ismartids;
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
          JSON.stringify([...formData.value.user_channels].sort()) !==
          JSON.stringify([...(props.deviceData?.user_channels || [])].sort())
        ) {
          updateData.user_channels = formData.value.user_channels;
        }
        if (
          JSON.stringify([...formData.value.all_channels].sort()) !==
          JSON.stringify([...(props.deviceData?.all_channels || [])].sort())
        ) {
          updateData.all_channels = formData.value.all_channels;
        }
        const nextRemarks = compactChannelRemarks(formData.value.channel_remarks);
        const previousRemarks = compactChannelRemarks(
          props.deviceData?.channel_remarks || {}
        );
        if (JSON.stringify(nextRemarks) !== JSON.stringify(previousRemarks)) {
          updateData.channel_remarks = nextRemarks;
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
          ismartid: formData.value.ismartids[0],
          ismartids: formData.value.ismartids,
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
          channel_remarks: compactChannelRemarks(formData.value.channel_remarks),
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
    :ok-button-props="{ disabled: isSyncingChannels }"
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <div v-if="props.mode === 'edit'" class="mb-3 flex items-center justify-end gap-2">
      <a-alert v-if="channelSyncError" type="warning" :message="channelSyncError" show-icon class="min-w-0 flex-1" />
      <a-tooltip title="同步頻道">
        <a-button
          aria-label="同步頻道"
          :loading="isSyncingChannels"
          :disabled="isLoading"
          @click="syncChannels"
        >
          <template #icon><ReloadOutlined /></template>
        </a-button>
      </a-tooltip>
    </div>
    <a-form
      ref="formRef"
      :model="formData"
      :label-col="{ style: { width: '140px' } }"
    >
      <a-form-item
        label="綁定大廈"
        name="ismartids"
        :rules="[{ required: true, type: 'array', min: 1, message: '請至少選擇一個大廈' }]"
      >
        <a-select
          v-model:value="formData.ismartids"
          mode="multiple"
          :loading="isLoadingBuildings"
          placeholder="選擇一個或多個大廈"
          :options="buildings.map((building) => ({
            label: `${building.name} (${building.ismartid})`,
            value: building.ismartid,
          }))"
        />
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
          v-model:value="formData.all_channels"
          mode="multiple"
          placeholder="請選擇設備頻道"
          option-filter-prop="label"
          max-tag-count="responsive"
          style="width: 100%"
          :options="channelOptions"
          :loading="isSyncingChannels"
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
          max-tag-count="responsive"
          placeholder="請選擇用戶可訪問的頻道"
          option-filter-prop="label"
          style="width: 100%"
          :options="channelOptions"
          :loading="isSyncingChannels"
        />
      </a-form-item>

      <a-form-item label="頻道說明">
        <div class="grid max-h-80 w-full grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          <div
            v-for="option in channelOptions"
            :key="option.value"
            class="min-w-0"
          >
            <div class="mb-1 break-all text-xs text-gray-500">{{ option.label }}</div>
            <a-input
              v-model:value="formData.channel_remarks[`channel${option.value}`]"
              :aria-label="`${option.label} 說明`"
              :title="option.label"
              placeholder="例如：大堂監控"
            />
          </div>
        </div>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<style scoped>
</style>
