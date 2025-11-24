<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Modal } from "ant-design-vue";
import { useDeviceData } from "./useDevice";
import type { Device } from "@/model/device";
import DeviceEditDialog from "./components/DeviceEditDialog.vue";

const { data, columns, isLoading, list, remove, fetch } = useDeviceData();

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
    title: "确定要删除这个设备吗？",
    onOk: () => deleteDevice(id),
  });
};

const handleCreated = () => {
  list();
};

const handleUpdated = () => {
  list();
};

onMounted(() => {
  list();
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

    <div class="flex justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-foreground">设备管理</h2>
        <p class="text-xs text-muted">Device Management</p>
        <p class="text-sm text-muted">與後端 /api/device* 接口保持一致</p>
      </div>
      <a-button
        type="primary"
        @click="showAddDeviceDialog"
      >新增设备</a-button>
    </div>

    <a-table
      :data-source="data"
      :columns="columns"
      :loading="isLoading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'is_active'">
          <a-tag :color="record.is_active ? 'green' : 'red'">
            {{ record.is_active ? '激活' : '未激活' }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'action'">
          <span>
            <a @click="editDevice(record)">编辑</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteDevice(record.id)"
            >删除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

