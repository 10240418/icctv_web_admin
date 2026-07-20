<script setup lang="ts">
import { onActivated, onMounted, ref } from "vue";
import { message, Modal } from "ant-design-vue";
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons-vue";
import type { Nvr } from "@/model/nvr";
import { formatDate } from "@/utils/dateFormat";
import NvrEditDialog from "./components/NvrEditDialog.vue";
import { useNvrData } from "./useNvr";

const { data, rawData, columns, isLoading, searchKeyword, list, remove, fetch, search } =
  useNvrData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedGroup = ref<Nvr>();

const showAddDialog = () => {
  editDialogMode.value = "create";
  selectedGroup.value = undefined;
  isEditDialogVisible.value = true;
};

const editGroup = async (group: Nvr) => {
  editDialogMode.value = "edit";
  selectedGroup.value = await fetch(group.id);
  isEditDialogVisible.value = true;
};

const confirmDelete = (group: Nvr) => {
  Modal.confirm({
    title: `刪除 RTSP 組「${group.name}」？`,
    content: "只會刪除伺服器保存的地址組，不會刪除 OrangePi 上現有的 MediaMTX Paths。",
    okText: "刪除",
    okType: "danger",
    onOk: () => remove(group.id),
  });
};

const pathName = (item: Nvr["rtsp_urls"][number]) =>
  item.path || (item.channel ? `channel${item.channel}` : "未命名");

const copyPathName = async (name: string) => {
  try {
    await navigator.clipboard.writeText(name);
    message.success("Path 名稱已複製到剪貼板");
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = name;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    message.success("Path 名稱已複製到剪貼板");
  }
};

const copyAllRtspUrls = async () => {
  const urls = [...new Set(
    rawData.value
      .flatMap((group) => group.rtsp_urls || [])
      .map((item) => item.url?.trim())
      .filter((url): url is string => Boolean(url)),
  )];

  if (urls.length === 0) {
    message.warning("暫無可複製的 RTSP 地址");
    return;
  }

  try {
    await navigator.clipboard.writeText(urls.join("\n"));
    message.success(`已複製 ${urls.length} 個 RTSP 地址到剪貼板`);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = urls.join("\n");
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    message.success(`已複製 ${urls.length} 個 RTSP 地址到剪貼板`);
  }
};

const handleSearch = (value?: string) => search(value?.trim() || "");

onMounted(list);
onActivated(list);
</script>

<template>
  <div class="space-y-4">
    <NvrEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :nvr-data="selectedGroup"
      @update:visible="isEditDialogVisible = $event"
      @created="list"
      @updated="list"
    />

    <div class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">RTSP 組管理</h2>
        <p class="text-sm text-muted">RTSP Groups</p>
      </div>
    </div>

    <div class="flex w-full items-center justify-between gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜尋組名、Path 或 RTSP 地址"
        class="max-w-sm"
        @search="handleSearch"
        @pressEnter="handleSearch(searchKeyword)"
      />
      <div class="flex items-center gap-2">
        <a-button @click="copyAllRtspUrls">
          <template #icon><CopyOutlined /></template>
          複製全部 URL
        </a-button>
        <a-button type="primary" @click="showAddDialog">
          <template #icon><PlusOutlined /></template>
          新增 RTSP 組
        </a-button>
      </div>
    </div>

    <a-table
      :data-source="data"
      :columns="columns"
      :loading="isLoading"
      row-key="id"
      :scroll="{ x: 1050 }"
      :pagination="{ defaultPageSize: 10, showSizeChanger: true }"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'path_count'">
          {{ record.rtsp_urls?.length || 0 }}
        </template>
        <template v-else-if="column.key === 'paths'">
          <div class="flex max-w-[420px] flex-wrap gap-1">
            <span v-for="item in record.rtsp_urls || []" :key="pathName(item)" class="inline-flex items-center">
              <a-tag>{{ pathName(item) }}</a-tag>
              <a-tooltip :title="`複製 ${pathName(item)}`">
                <a-button type="text" size="small" @click="copyPathName(pathName(item))">
                  <template #icon><CopyOutlined /></template>
                </a-button>
              </a-tooltip>
            </span>
            <span v-if="!record.rtsp_urls?.length" class="text-muted">無</span>
          </div>
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="flex items-center gap-1">
            <a-tooltip title="編輯 RTSP 組">
              <a-button type="text" shape="circle" @click="editGroup(record)">
                <template #icon><EditOutlined /></template>
              </a-button>
            </a-tooltip>
            <a-tooltip title="刪除 RTSP 組">
              <a-button type="text" danger shape="circle" @click="confirmDelete(record)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-tooltip>
          </div>
        </template>
      </template>
    </a-table>
  </div>
</template>
