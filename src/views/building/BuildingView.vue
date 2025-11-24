<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Modal } from "ant-design-vue";
import { useBuildingData } from "./useBuilding";
import type { Building } from "@/model/building";
import BuildingEditDialog from "./components/BuildingEditDialog.vue";

const { data, columns, isLoading, list, remove, fetch } = useBuildingData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedBuildingData = ref<Building | undefined>(undefined);

const showAddBuildingDialog = () => {
  editDialogMode.value = "create";
  selectedBuildingData.value = undefined;
  isEditDialogVisible.value = true;
};

const editBuilding = async (building: Building) => {
  editDialogMode.value = "edit";
  selectedBuildingData.value = await fetch(building.id);
  isEditDialogVisible.value = true;
};

const deleteBuilding = async (id: number) => {
  await remove(id);
};

const confirmDeleteBuilding = (id: number) => {
  Modal.confirm({
    title: "确定要删除这个建筑吗？",
    onOk: () => deleteBuilding(id),
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
    <BuildingEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :building-data="selectedBuildingData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />

    <div class="flex justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-foreground">大廈資訊</h2>
        <p class="text-xs text-muted">Building Information</p>
        <p class="text-sm text-muted">對應 /api/building* 接口</p>
      </div>
      <a-button
        type="primary"
        @click="showAddBuildingDialog"
      >新增大廈</a-button>
    </div>

    <a-table
      :data-source="data"
      :columns="columns"
      :loading="isLoading"
      :pagination="false"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <span>
            <a @click="editBuilding(record)">编辑</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteBuilding(record.id)"
            >删除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

