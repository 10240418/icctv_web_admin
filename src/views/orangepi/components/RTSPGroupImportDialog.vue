<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import type { TableProps } from "ant-design-vue";
import { ReloadOutlined } from "@ant-design/icons-vue";
import { DeviceApi, NvrApi, OrangePiRemoteApi } from "@/httpapis/api";
import type { Device } from "@/model/device";
import type { Nvr } from "@/model/nvr";
import { channelKeyForPath } from "../channelCatalogue";
import {
  createRTSPImportItems,
  importErrorMessage,
  importRTSPPaths,
  listAllRTSPPaths,
  type ImportStatus,
  type RTSPImportItem,
} from "../rtspGroupImport";

const props = defineProps<{
  visible: boolean;
  device?: Device;
  token: string;
  initialGroupId?: number;
}>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
  "update:busy": [value: boolean];
  imported: [];
}>();

const groups = ref<Nvr[]>([]);
const isLoadingGroups = ref(false);
const selectedGroupId = ref<number>();
const items = ref<RTSPImportItem[]>([]);
const selectedKeys = ref<number[]>([]);
const isImporting = ref(false);
const loadError = ref("");
const importError = ref("");
const attempted = ref(false);
const selectedItems = computed(() => {
  const keys = new Set(selectedKeys.value);
  return items.value.filter((item) => keys.has(item.key) && item.status !== "success");
});
const failedItems = computed(() => items.value.filter((item) => item.status === "error"));
const counts = computed(() => ({
  success: items.value.filter((item) => item.status === "success").length,
  conflict: items.value.filter((item) => item.status === "conflict").length,
  error: failedItems.value.length,
}));
const statusLabels: Record<ImportStatus, string> = {
  pending: "待新增",
  importing: "新增中",
  success: "已新增",
  conflict: "重名跳過",
  error: "新增失敗",
};
const statusColors: Record<ImportStatus, string> = {
  pending: "default",
  importing: "processing",
  success: "success",
  conflict: "warning",
  error: "error",
};
const columns = [
  { title: "Path 名稱", key: "name", width: 170 },
  { title: "RTSP 地址", dataIndex: "source", key: "source", width: 220, ellipsis: true },
  { title: "說明", dataIndex: "remark", key: "remark", width: 120, ellipsis: true },
  { title: "結果", key: "status", width: 230 },
];
const rowSelection = computed<TableProps["rowSelection"]>(() => ({
  selectedRowKeys: selectedKeys.value,
  onChange: (keys) => { selectedKeys.value = keys as number[]; },
  getCheckboxProps: (record) => ({
    disabled: isImporting.value || record.status === "success",
  }),
}));

const selectGroup = () => {
  const group = groups.value.find((candidate) => candidate.id === selectedGroupId.value);
  items.value = createRTSPImportItems(group?.rtsp_urls || []);
  selectedKeys.value = items.value.map((item) => item.key);
  importError.value = "";
  attempted.value = false;
};

const loadGroups = async () => {
  isLoadingGroups.value = true;
  loadError.value = "";
  try {
    const response = await NvrApi.list();
    const data = response.data.data as Nvr[] | { items: Nvr[] } | Nvr | null;
    groups.value = Array.isArray(data) ? data
      : data && "items" in data ? data.items
      : data ? [data] : [];
    selectGroup();
  } catch (error) {
    loadError.value = `載入 RTSP 組失敗：${importErrorMessage(error)}`;
  } finally {
    isLoadingGroups.value = false;
  }
};

watch(() => props.visible, (visible) => {
  if (!visible) return;
  selectedGroupId.value = props.initialGroupId;
  items.value = [];
  selectedKeys.value = [];
  groups.value = [];
  importError.value = "";
  attempted.value = false;
  void loadGroups();
}, { immediate: true });

const resetItemStatus = (item: RTSPImportItem) => {
  item.status = "pending";
  item.error = "";
};

const syncRemarks = async (deviceId: number) => {
  const imported = items.value.filter((item) => item.status === "success" && item.remark);
  if (imported.length === 0) return;
  // Merge with current server data, not the device snapshot from when the dialog opened.
  const response = await DeviceApi.list();
  const device = response.data.data.find((candidate) => candidate.id === deviceId);
  if (!device) throw new Error("設備不存在");
  const remarks = Object.fromEntries(imported.flatMap((item) => {
    const key = channelKeyForPath(device, item.name);
    return key ? [[key, item.remark]] : [];
  }));
  if (Object.keys(remarks).length === 0) return;
  await DeviceApi.update({
    channel_remarks: { ...device.channel_remarks, ...remarks },
  }, deviceId);
};

const runImport = async (targets: RTSPImportItem[]) => {
  if (isImporting.value || targets.length === 0 || !props.device || !props.token) return;
  const deviceId = props.device.id;
  const token = props.token;
  const pageSize = 50;
  isImporting.value = true;
  emit("update:busy", true);
  importError.value = "";
  try {
    // A name on another page must be treated as a conflict too.
    const existingPaths = await listAllRTSPPaths(async (page) => {
      const response = await OrangePiRemoteApi.listPaths({
        id: deviceId, token, page, items_per_page: pageSize,
      });
      return response.data.data;
    }, pageSize);
    attempted.value = true;
    await importRTSPPaths(targets, existingPaths, async (item) => {
      const response = await OrangePiRemoteApi.addPath({
        id: deviceId,
        token,
        name: item.name,
        config: { source: item.source, sourceOnDemand: false, record: false },
      });
      if (!response.data.success) throw new Error(response.data.error || "新增 Path 失敗");
    });
    selectedKeys.value = failedItems.value.map((item) => item.key);
    try {
      await syncRemarks(deviceId);
    } catch (error) {
      message.warning(`Path 已新增，但頻道說明同步失敗：${importErrorMessage(error)}`);
    }
  } catch (error) {
    importError.value = `讀取設備 Paths 失敗，尚未執行批量新增：${importErrorMessage(error)}`;
  } finally {
    isImporting.value = false;
    emit("update:busy", false);
    emit("imported");
  }
};

const close = () => {
  if (!isImporting.value) emit("update:visible", false);
};
</script>

<template>
  <a-modal
    :open="visible"
    :title="`新增一組 RTSP${device ? ` - ${device.name}` : ''}`"
    width="min(960px, calc(100vw - 32px))"
    :mask-closable="false"
    :closable="!isImporting"
    :keyboard="!isImporting"
    @cancel="close"
  >
    <a-form layout="vertical">
      <a-form-item label="RTSP 組">
        <div class="flex min-w-0 gap-2">
          <a-select
            v-model:value="selectedGroupId"
            class="min-w-0 flex-1"
            placeholder="選擇 RTSP 組"
            show-search
            allow-clear
            option-filter-prop="label"
            :disabled="isImporting || isLoadingGroups"
            :loading="isLoadingGroups"
            :options="groups.map((group) => ({ value: group.id, label: group.name }))"
            @change="selectGroup"
          />
          <a-tooltip title="重新載入 RTSP 組">
            <a-button
              aria-label="重新載入 RTSP 組"
              :disabled="isImporting || isLoadingGroups"
              @click="loadGroups"
            >
              <template #icon><ReloadOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
      </a-form-item>
    </a-form>

    <a-alert v-if="loadError" class="mb-3" type="error" :message="loadError" show-icon />
    <a-alert v-if="importError" class="mb-3" type="error" :message="importError" show-icon />
    <div
      v-if="attempted"
      class="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-sm"
      aria-live="polite"
      role="status"
    >
      <span>已新增 {{ counts.success }}</span>
      <span>重名跳過 {{ counts.conflict }}</span>
      <span>失敗 {{ counts.error }}</span>
    </div>
    <a-table
      :columns="columns"
      :data-source="items"
      :row-selection="rowSelection"
      :pagination="false"
      :scroll="{ x: 780, y: 360 }"
      :loading="isLoadingGroups"
      :locale="{ emptyText: selectedGroupId ? '此組沒有 RTSP 流' : '尚未選擇 RTSP 組' }"
      row-key="key"
      size="small"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a-input
            v-model:value="record.name"
            :aria-label="`第 ${record.key + 1} 個 Path 名稱`"
            :disabled="isImporting || record.status === 'success'"
            @change="resetItemStatus(record)"
          />
        </template>
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColors[record.status as ImportStatus]">
            {{ statusLabels[record.status as ImportStatus] }}
          </a-tag>
          <div v-if="record.error" class="mt-1 break-words text-xs text-red-700">
            {{ record.error }}
          </div>
        </template>
      </template>
    </a-table>
    <template #footer>
      <div class="flex flex-wrap items-center justify-end gap-2">
        <a-button :disabled="isImporting" @click="close">關閉</a-button>
        <a-button
          v-if="failedItems.length"
          :disabled="isImporting"
          @click="runImport([...failedItems])"
        >
          <template #icon><ReloadOutlined /></template>
          重試失敗項目
        </a-button>
        <a-button
          type="primary"
          :loading="isImporting"
          :disabled="isLoadingGroups || !token || selectedItems.length === 0"
          @click="runImport([...selectedItems])"
        >
          批量新增（{{ selectedItems.length }}）
        </a-button>
      </div>
    </template>
  </a-modal>
</template>
