<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Modal } from "ant-design-vue";
import { useNvrData } from "./useNvr";
import type { Nvr } from "@/model/nvr";
import NvrEditDialog from "./components/NvrEditDialog.vue";

const { data, columns, isLoading, list, remove, fetch } = useNvrData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedNvrData = ref<Nvr | undefined>(undefined);

const showAddNvrDialog = () => {
  editDialogMode.value = "create";
  selectedNvrData.value = undefined;
  isEditDialogVisible.value = true;
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

onMounted(() => {
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

    <div class="flex justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-foreground">NVR 管理</h2>
        <p class="text-xs text-muted">NVR Management</p>
      </div>
      <a-button
        type="primary"
        @click="showAddNvrDialog"
      >新增 NVR</a-button>
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


