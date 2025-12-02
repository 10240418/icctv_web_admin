<script setup lang="ts">
import { ref, onMounted, onActivated } from "vue";
import { Modal } from "ant-design-vue";
import { useBuildingData } from "./useBuilding";
import type { Building } from "@/model/building";
import BuildingEditDialog from "./components/BuildingEditDialog.vue";
import BuildingDetailDialog from "./components/BuildingDetailDialog.vue";
import { formatDate } from "@/utils/dateFormat";

const { data, columns, isLoading, searchKeyword, list, remove, fetch, search } =
  useBuildingData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedBuildingData = ref<Building | undefined>(undefined);
const isDetailDialogVisible = ref(false);
const detailBuildingData = ref<Building | undefined>(undefined);

const showAddBuildingDialog = () => {
  editDialogMode.value = "create";
  selectedBuildingData.value = undefined;
  isEditDialogVisible.value = true;
};

const showBuildingDetail = (building: Building) => {
  detailBuildingData.value = building;
  isDetailDialogVisible.value = true;
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
    title: "確定要刪除這個建築嗎？",
    onOk: () => deleteBuilding(id),
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
    <BuildingEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :building-data="selectedBuildingData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />
    <BuildingDetailDialog
      :visible="isDetailDialogVisible"
      :building-data="detailBuildingData"
      @update:visible="isDetailDialogVisible = $event"
    />

    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">大廈資訊</h2>
        <p class="text-sm text-muted">Building Information</p>
      </div>
    </div>

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜尋大廈名稱或 iSmart ID"
        style="width: 250px"
        @search="handleSearch"
        @pressEnter="handleSearch(searchKeyword)"
      />
      <a-button
        type="primary"
        @click="showAddBuildingDialog"
      >新增大廈</a-button>
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
            <a @click="showBuildingDetail(record)">詳情</a>
            <a-divider type="vertical" />
            <a @click="editBuilding(record)">編輯</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteBuilding(record.id)"
            >刪除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

