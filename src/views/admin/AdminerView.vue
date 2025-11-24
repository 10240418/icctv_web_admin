<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Modal } from "ant-design-vue";
import { useAdminData } from "./useAdmin";
import type { Admin } from "@/model/admin";
import AdminEditDialog from "./components/AdminEditDialog.vue";

const { data, columns, pagination, isLoading, list, remove, fetch } =
  useAdminData();

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
    title: "确定要删除这个管理员吗？",
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

onMounted(() => {
  list();
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

    <div class="flex justify-between">
      <div>
        <h2 class="text-2xl font-semibold text-foreground">管理員管理</h2>
        <p class="text-xs text-muted">Administrator Management</p>
        <p class="text-sm text-muted">與後端 /api/admin* 接口保持一致</p>
      </div>
      <a-button
        type="primary"
        @click="showAddAdminDialog"
      >新增管理員</a-button>
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
            <a @click="editAdmin(record)">编辑</a>
            <a-divider type="vertical" />
            <a
              style="color: lightcoral;"
              @click="confirmDeleteAdmin(record.id)"
            >删除</a>
          </span>
        </template>
      </template>
    </a-table>

    <a-pagination
      v-model:current="pagination.currentPage"
      v-model:pageSize="pagination.pageSize"
      :total="pagination.total"
      show-size-changer
      @change="onPageChange"
      @showSizeChange="onPageChange"
    />
  </div>
</template>

