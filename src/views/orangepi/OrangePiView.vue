<script setup lang="ts">
import { onMounted, onActivated, ref } from "vue";
import { Modal } from "ant-design-vue";
import type { Device } from "@/model/device";
import { useOrangePiData } from "./useOrangePi";
import OrangePiEditDialog from "./components/OrangePiEditDialog.vue";
import OrangePiDetailDialog from "./components/OrangePiDetailDialog.vue";
import { formatDate } from "@/utils/dateFormat";

const {
  data,
  columns,
  isLoading,
  searchKeyword,
  setSearchKeyword,
  list,
  fetch,
  remove,
} = useOrangePiData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedDeviceData = ref<Device | undefined>(undefined);
const isDetailDialogVisible = ref(false);
const detailDevice = ref<Device | undefined>(undefined);

const handleSearch = (value?: string) => {
  setSearchKeyword(value?.trim() || "");
  list(value?.trim() || undefined);
};

const showAddDialog = () => {
  editDialogMode.value = "create";
  selectedDeviceData.value = undefined;
  isEditDialogVisible.value = true;
};

const showDetailDialog = (device: Device) => {
  detailDevice.value = device;
  isDetailDialogVisible.value = true;
};

const editDevice = async (device: Device) => {
  editDialogMode.value = "edit";
  selectedDeviceData.value = await fetch(device.id);
  isEditDialogVisible.value = true;
};

const deleteDevice = async (id: number) => {
  await remove(id);
};

const confirmDelete = (id: number) => {
  Modal.confirm({
    title: "確定要刪除這個設備嗎？",
    onOk: () => deleteDevice(id),
  });
};

const handleCreated = () => {
  list(searchKeyword.value || undefined);
};

const handleUpdated = () => {
  list(searchKeyword.value || undefined);
};

onMounted(() => {
  list();
});

onActivated(() => {
  list(searchKeyword.value || undefined);
});
</script>

<template>
  <div class="space-y-4">
    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">香橙派</h2>
        <p class="text-sm text-muted">OrangePi Devices</p>
      </div>
    </div>

    <OrangePiEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :device-data="selectedDeviceData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />

    <OrangePiDetailDialog
      :visible="isDetailDialogVisible"
      :device="detailDevice"
      @update:visible="isDetailDialogVisible = $event"
      @refresh-list="handleUpdated"
    />

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="輸入 iSmart ID 搜尋"
        style="width: 250px"
        @search="handleSearch"
      />
      <a-button
        type="primary"
        @click="showAddDialog"
      >創建設備</a-button>
    </div>

    <a-table
      :columns="columns"
      :data-source="data"
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
        <template v-if="column.key === 'is_active'">
          <a-tag :color="record.is_active ? 'green' : 'red'">
            {{ record.is_active ? '啟用' : '停用' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <span>
            <a @click="showDetailDialog(record)">詳情</a>
            <a-divider type="vertical" />
            <a @click="editDevice(record)">編輯</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDelete(record.id)"
            >刪除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

