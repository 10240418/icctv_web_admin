<script setup lang="ts">
import { ref, onMounted } from "vue";
import { message } from "ant-design-vue";
import { PublicNetApi } from "@/httpapis/api";

const data = ref([
  {
    id: 1,
    external_ip: "",
  },
]);

const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
    width: 80,
  },
  {
    title: "公網 IP",
    dataIndex: "external_ip",
    key: "external_ip",
  },
  {
    title: "操作",
    key: "action",
    width: 150,
  },
];

const isLoading = ref(false);
const isEditDialogVisible = ref(false);
const editFormState = ref({
  external_ip: "",
});
const isSubmitting = ref(false);

const loadData = async () => {
  isLoading.value = true;
  try {
    const response = await PublicNetApi.get();
    if (response.data.data && data.value[0]) {
      data.value[0].external_ip = response.data.data.external_ip || "";
    }
  } catch (error) {
    console.error("加載失敗", error);
    message.error("加載配置失敗");
  } finally {
    isLoading.value = false;
  }
};

const showEditDialog = () => {
  if (data.value[0]) {
    editFormState.value.external_ip = data.value[0].external_ip;
  }
  isEditDialogVisible.value = true;
};

const onSubmit = async () => {
  if (isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    await PublicNetApi.update({
      external_ip: editFormState.value.external_ip.trim(),
    });
    if (data.value[0]) {
      data.value[0].external_ip = editFormState.value.external_ip.trim();
    }
    message.success("公網配置已更新");
    isEditDialogVisible.value = false;
  } catch (error: any) {
    const backendError = error?.response?.data?.error;
    message.error(backendError || "更新失敗，請稍後再試");
  } finally {
    isSubmitting.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="space-y-4">
    <div
      class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">公網配置</h2>
        <p class="text-sm text-muted">Public Network Config</p>
      </div>
    </div>

    <div class="flex w-full justify-between items-center gap-3">
      <a-input-search
        placeholder="搜尋配置"
        style="width: 250px"
        disabled
      />
      <a-button
        type="primary"
        @click="showEditDialog"
      >編輯配置</a-button>
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
      <template #bodyCell="{ column }">
        <template v-if="column.key === 'action'">
          <span>
            <a @click="showEditDialog">編輯</a>
          </span>
        </template>
      </template>
    </a-table>

    <!-- 編輯對話框 -->
    <a-modal
      v-model:open="isEditDialogVisible"
      title="編輯公網配置"
      @ok="onSubmit"
      @cancel="isEditDialogVisible = false"
    >
      <a-form
        layout="vertical"
        :model="editFormState"
      >
        <a-form-item
          label="公網 IP"
          name="external_ip"
          :rules="[{ required: true, message: '請輸入公網 IP' }]"
        >
          <a-input
            v-model:value="editFormState.external_ip"
            placeholder="例如 120.33.41.90"
          />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="isEditDialogVisible = false">取消</a-button>
        <a-button
          type="primary"
          :loading="isSubmitting"
          @click="onSubmit"
        >保存</a-button>
      </template>
    </a-modal>
  </div>
</template>

