<script setup lang="ts">
import { ref, onMounted, onActivated } from "vue";
import { Modal } from "ant-design-vue";
import { useDeviceData } from "./useDevice";
import type { Device } from "@/model/device";
import DeviceEditDialog from "./components/DeviceEditDialog.vue";
import { formatDate } from "@/utils/dateFormat";

const { data, columns, isLoading, searchKeyword, list, remove, fetch, search } =
  useDeviceData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedDeviceData = ref<Device | undefined>(undefined);

const showAddDeviceDialog = () => {
  editDialogMode.value = "create";
  selectedDeviceData.value = undefined;
  isEditDialogVisible.value = true;
};

const editDevice = async (device: Device) => {
  editDialogMode.value = "edit";
  selectedDeviceData.value = await fetch(device.id);
  isEditDialogVisible.value = true;
};

const deleteDevice = async (id: number) => {
  await remove(id);
};

const confirmDeleteDevice = (id: number) => {
  Modal.confirm({
    title: "確定要刪除這個設備嗎？",
    onOk: () => deleteDevice(id),
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
  list(searchKeyword.value || undefined);
});
</script>

<template>
  <div class="space-y-4">
    <DeviceEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :device-data="selectedDeviceData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />

    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">設備管理</h2>
        <p class="text-sm text-muted">Device Management</p>
      </div>
    </div>

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="輸入 iSmart ID 搜尋"
        style="width: 250px"
        @search="handleSearch"
        @pressEnter="handleSearch(searchKeyword)"
      />
      <a-button
        type="primary"
        @click="showAddDeviceDialog"
      >新增設備</a-button>
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
        <template v-if="column.key === 'is_active'">
          <a-tag :color="record.is_active ? 'green' : 'red'">
            {{ record.is_active ? '激活' : '未激活' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <span>
            <a @click="editDevice(record)">編輯</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteDevice(record.id)"
            >刪除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

