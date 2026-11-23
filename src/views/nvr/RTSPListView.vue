<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { CopyOutlined, ReloadOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import type { Nvr } from "@/model/nvr";
import type { RTSPSource } from "@/model/rtspSource";
import { RTSPSourceApi } from "@/httpapis/apis/rtspSource";
import { formatDateTime } from "@/utils/dateFormat";
import NvrEditDialog from "./components/NvrEditDialog.vue";
import RTSPSourceEditDialog from "./components/RTSPSourceEditDialog.vue";
import { useNvrData } from "./useNvr";

const { fetch } = useNvrData();
const isLoading = ref(false);
const sources = ref<RTSPSource[]>([]);
const keyword = ref("");
const buildingId = ref<number>();
const currentPage = ref(1);
const pageSize = ref(20);
const loadError = ref(false);
const selectedGroup = ref<Nvr>();
const isEditDialogVisible = ref(false);
const selectedSource = ref<RTSPSource>();
const sourceDialogVisible = ref(false);

const rows = computed(() => sources.value.map((source) => ({
  ...source,
  buildingId: source.building_id || 0,
  buildingName: source.building?.name || (source.building_id ? `大廈 #${source.building_id}` : "未指定"),
  usageText: source.usages.map((usage) => `${usage.group_name} ${usage.path}`).join(" "),
})));

const buildingOptions = computed(() => {
  const buildings = new Map(rows.value.map((row) => [row.buildingId, row.buildingName]));
  return [...buildings].map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "zh-HK"));
});

const filteredRows = computed(() => {
  const query = keyword.value.trim().toLowerCase();
  return rows.value.filter((row) =>
    (buildingId.value === undefined || row.buildingId === buildingId.value)
    && (!query || [row.url, row.remark, row.usageText, row.buildingName]
      .some((value) => value.toLowerCase().includes(query))),
  );
});

const columns = [
  { title: "序號", key: "sequence", width: 64, fixed: "left" as const },
  { title: "RTSP 地址", dataIndex: "url", key: "url", width: 300 },
  { title: "所屬大廈", dataIndex: "buildingName", key: "building", width: 130 },
  { title: "標註說明", dataIndex: "remark", key: "remark", width: 160 },
  { title: "使用中的 RTSP 組 / Path", key: "group", width: 220 },
  { title: "地址更新時間（香港）", dataIndex: "updatedAt", key: "updatedAt", width: 220 },
  { title: "操作", key: "action", width: 100, fixed: "right" as const },
];

const reload = async () => {
  loadError.value = false;
  isLoading.value = true;
  try {
    const response = await RTSPSourceApi.list();
    sources.value = response.data.data;
    const lastPage = Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value));
    currentPage.value = Math.min(currentPage.value, lastPage);
  } catch {
    loadError.value = true;
  } finally {
    isLoading.value = false;
  }
};

const editSource = (source?: RTSPSource) => {
  selectedSource.value = source;
  sourceDialogVisible.value = true;
};

const deleteSource = (source: RTSPSource) => {
  Modal.confirm({
    title: "刪除此 RTSP 地址？",
    content: source.url,
    okText: "刪除地址",
    okType: "danger",
    cancelText: "取消",
    onOk: async () => {
      try {
        await RTSPSourceApi.remove(source.id);
        message.success("RTSP 地址已刪除");
        await reload();
      } catch (error: any) {
        message.error(error.response?.data?.error || "刪除失敗");
        await reload();
        throw error;
      }
    },
  });
};

const editGroup = async (id: number) => {
  try {
    selectedGroup.value = await fetch(id);
    isEditDialogVisible.value = true;
  } catch {
    // The shared fetch function displays the API error.
  }
};

const copyUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    message.success("RTSP 地址已複製");
  } catch {
    message.error("複製失敗，請重試");
  }
};

const handleTableChange = (pagination: { current?: number; pageSize?: number }) => {
  currentPage.value = pagination.current || 1;
  pageSize.value = pagination.pageSize || 20;
};

watch([keyword, buildingId], () => { currentPage.value = 1; });
onMounted(reload);
</script>

<template>
  <div class="min-w-0 space-y-4">
    <NvrEditDialog
      :visible="isEditDialogVisible"
      mode="edit"
      :nvr-data="selectedGroup"
      @update:visible="isEditDialogVisible = $event"
      @updated="reload"
    />
    <RTSPSourceEditDialog
      v-model:visible="sourceDialogVisible"
      :source="selectedSource"
      @saved="reload"
    />

    <div class="border-b border-gray-300 pb-4">
      <h2 class="text-2xl font-semibold text-foreground">RTSP 清單</h2>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <a-button type="primary" aria-label="新增 RTSP 地址" @click="editSource()">
        <template #icon><PlusOutlined /></template>
        新增 RTSP 地址
      </a-button>
      <a-input-search
        v-model:value="keyword"
        allow-clear
        aria-label="搜尋 RTSP 地址"
        placeholder="搜尋地址、大廈、備註、組名或 Path"
        class="w-full sm:max-w-sm"
      />
      <label for="rtsp-building-filter" class="sr-only">篩選所屬大廈</label>
      <a-select
        id="rtsp-building-filter"
        v-model:value="buildingId"
        :options="buildingOptions"
        allow-clear
        show-search
        option-filter-prop="label"
        placeholder="全部大廈"
        class="w-full sm:w-52"
      />
      <a-tooltip title="重新整理">
        <a-button aria-label="重新整理 RTSP 清單" :loading="isLoading" @click="reload">
          <template #icon><ReloadOutlined /></template>
        </a-button>
      </a-tooltip>
    </div>

    <a-alert v-if="loadError" type="error" show-icon message="載入 RTSP 清單失敗，請重新整理。" />

    <a-table
      size="middle"
      :columns="columns"
      :data-source="filteredRows"
      :loading="isLoading"
      row-key="id"
      :scroll="{ x: 1194 }"
      :pagination="{
        current: currentPage,
        pageSize,
        showSizeChanger: true,
        showTotal: (total: number) => `共 ${total} 個 RTSP 地址`,
      }"
      :locale="{ emptyText: loadError ? '資料載入失敗' : '沒有符合條件的 RTSP 地址' }"
      @change="handleTableChange"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'sequence'">
          {{ (currentPage - 1) * pageSize + index + 1 }}
        </template>
        <template v-else-if="column.key === 'url'">
          <div class="flex items-start gap-2">
            <span class="min-w-0 flex-1 break-all font-mono text-xs">{{ record.url }}</span>
            <a-tooltip title="複製 RTSP 地址">
              <a-button
                type="text"
                size="small"
                class="shrink-0"
                :aria-label="`複製地址 ${record.id}`"
                @click="copyUrl(record.url)"
              >
                <template #icon><CopyOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>
        </template>
        <template v-else-if="column.key === 'group'">
          <span v-if="!record.usages.length" class="text-gray-500">未使用</span>
          <div v-for="usage in record.usages" :key="`${usage.group_id}:${usage.path}`">
            <a-button
              type="link"
              class="group-link"
              :aria-label="`編輯 RTSP 組 ${usage.group_name}`"
              @click="editGroup(usage.group_id)"
            >
              {{ usage.group_name }} / {{ usage.path }}
            </a-button>
          </div>
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="flex gap-1">
            <a-tooltip title="編輯地址">
              <a-button type="text" :aria-label="`編輯地址 ${record.id}`" @click="editSource(record)">
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip :title="record.usages.length ? '請先從 RTSP 組移除此地址' : '刪除地址'">
              <span>
                <a-button type="text" danger :disabled="record.usages.length > 0" :aria-label="`刪除地址 ${record.id}`" @click="deleteSource(record)">
                  <template #icon><DeleteOutlined /></template>
                </a-button>
              </span>
            </a-tooltip>
          </div>
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          <span class="whitespace-nowrap">{{ formatDateTime(record.updatedAt) || "—" }}</span>
        </template>
        <template v-else>
          <span class="break-words [overflow-wrap:anywhere]">{{ record[column.dataIndex] || "—" }}</span>
        </template>
      </template>
    </a-table>
  </div>
</template>

<style scoped>
.group-link {
  height: auto;
  max-width: 100%;
  padding: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  text-align: left;
}
</style>
