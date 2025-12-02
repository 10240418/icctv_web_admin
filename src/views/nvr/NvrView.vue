<script setup lang="ts">
import { ref, onMounted, onActivated } from "vue";
import { Modal } from "ant-design-vue";
import { useNvrData } from "./useNvr";
import type { Nvr } from "@/model/nvr";
import NvrEditDialog from "./components/NvrEditDialog.vue";
import NvrDetailDialog from "./components/NvrDetailDialog.vue";
import { formatDate } from "@/utils/dateFormat";

const { data, columns, isLoading, searchKeyword, list, remove, fetch, search } =
  useNvrData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedNvrData = ref<Nvr | undefined>(undefined);
const isDetailDialogVisible = ref(false);
const detailNvr = ref<Nvr | undefined>(undefined);

const showAddNvrDialog = () => {
  editDialogMode.value = "create";
  selectedNvrData.value = undefined;
  isEditDialogVisible.value = true;
};

const showDetailDialog = async (nvr: Nvr) => {
  detailNvr.value = await fetch(nvr.id);
  isDetailDialogVisible.value = true;
};

const editNvr = async (nvr: Nvr) => {
  editDialogMode.value = "edit";
  selectedNvrData.value = await fetch(nvr.id);
  isEditDialogVisible.value = true;
};

const deleteNvr = async (id: number) => {
  await remove(id);
};

const confirmDeleteNvr = (id: number) => {
  Modal.confirm({
    title: "確定要刪除這個 NVR 嗎？",
    onOk: () => deleteNvr(id),
  });
};

const handleCreated = () => {
  list();
};

const handleUpdated = () => {
  list();
};

const handleSearch = (value?: string) => {
  search(value?.trim() || "");
};

onMounted(() => {
  list();
});

onActivated(() => {
  list();
});
</script>

<template>
  <div class="space-y-4">
    <NvrEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :nvr-data="selectedNvrData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />

    <NvrDetailDialog
      :visible="isDetailDialogVisible"
      :nvr="detailNvr"
      @update:visible="isDetailDialogVisible = $event"
      @refresh-list="handleUpdated"
    />

    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">NVR 管理</h2>
        <p class="text-sm text-muted">NVR Management</p>
      </div>
    </div>

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜尋 NVR 名稱或地址"
        style="width: 250px"
        @search="handleSearch"
        @pressEnter="handleSearch(searchKeyword)"
      />
      <a-button
        type="primary"
        @click="showAddNvrDialog"
      >新增 NVR</a-button>
    </div>

    <a-table
      :data-source="data"
      :columns="columns"
      :loading="isLoading"
      :pagination="{
        position: ['bottomRight'],
        hideOnSinglePage: false,
        showSizeChanger: true,
        defaultPageSize: 10,
      }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <span>
            <a @click="showDetailDialog(record)">詳情</a>
            <a-divider type="vertical" />
            <a @click="editNvr(record)">編輯</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteNvr(record.id)"
            >刪除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>


