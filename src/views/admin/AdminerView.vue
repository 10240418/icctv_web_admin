<script setup lang="ts">
import { ref, onMounted, onActivated } from "vue";
import { Modal } from "ant-design-vue";
import { useAdminData } from "./useAdmin";
import type { Admin } from "@/model/admin";
import AdminEditDialog from "./components/AdminEditDialog.vue";
import { formatDate } from "@/utils/dateFormat";

const {
  data,
  columns,
  pagination,
  isLoading,
  searchKeyword,
  list,
  remove,
  fetch,
  search,
} = useAdminData();

const isEditDialogVisible = ref(false);
const editDialogMode = ref<"create" | "edit">("create");
const selectedAdminData = ref<Admin | undefined>(undefined);

const showAddAdminDialog = () => {
  editDialogMode.value = "create";
  selectedAdminData.value = undefined;
  isEditDialogVisible.value = true;
};

const editAdmin = async (admin: Admin) => {
  editDialogMode.value = "edit";
  selectedAdminData.value = await fetch(admin.id);
  isEditDialogVisible.value = true;
};

const deleteAdmin = async (id: number) => {
  await remove(id);
};

const confirmDeleteAdmin = (id: number) => {
  Modal.confirm({
    title: "確定要刪除這個管理員嗎？",
    onOk: () => deleteAdmin(id),
  });
};

const onPageChange = () => {
  list();
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
    <AdminEditDialog
      :visible="isEditDialogVisible"
      :mode="editDialogMode"
      :admin-data="selectedAdminData"
      @update:visible="isEditDialogVisible = $event"
      @created="handleCreated"
      @updated="handleUpdated"
    />

    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">管理員管理</h2>
        <p class="text-sm text-muted">Administrator Management</p>
      </div>
    </div>

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        v-model:value="searchKeyword"
        placeholder="搜尋管理員名稱"
        style="width: 250px"
        @search="handleSearch"
        @pressEnter="handleSearch(searchKeyword)"
      />
      <a-button
        type="primary"
        @click="showAddAdminDialog"
      >新增管理員</a-button>
    </div>

    <a-table
      :data-source="data"
      :columns="columns"
      :loading="isLoading"
      :pagination="{
        position: ['bottomRight'],
        hideOnSinglePage: false,
        showSizeChanger: true,
        current: pagination.currentPage,
        pageSize: pagination.pageSize,
        total: pagination.total,
        onChange: onPageChange,
        onShowSizeChange: onPageChange,
      }"
      row-key="id"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'updatedAt'">
          {{ formatDate(record.updatedAt) }}
        </template>
        <template v-else-if="column.key === 'action'">
          <span>
            <a @click="editAdmin(record)">編輯</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteAdmin(record.id)"
            >刪除</a>
          </span>
        </template>
      </template>
    </a-table>
  </div>
</template>

