<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import type { Building } from "@/model/building";
import type { TableProps } from "ant-design-vue";
import { BuildingBindApi, BuildingNvrBindApi } from "@/httpapis/api";
import type { Device } from "@/model/device";
import type { Nvr } from "@/model/nvr";
import BindDeviceDialog from "./BindDeviceDialog.vue";

const props = defineProps<{
  visible: boolean;
  buildingData?: Building;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  updated: [];
}>();

const activeTab = ref<"orangepi" | "nvr">("orangepi");
const orangepiPagination = ref({ current: 1, pageSize: 5 });
const nvrPagination = ref({ current: 1, pageSize: 5 });
const boundOrangepis = ref<Device[]>([]);
const boundNvrs = ref<Nvr[]>([]);
const isLoading = ref(false);
const isBindDialogVisible = ref(false);
const bindDialogType = ref<"orangepi" | "nvr">("orangepi");

// 加載綁定的設備
const loadBoundDevices = async () => {
  if (!props.buildingData?.id) return;

  isLoading.value = true;
  try {
    // 獲取綁定的 OrangePi - API 直接返回完整的設備對象數組
    const orangepiRes = await BuildingBindApi.getByBuilding(
      props.buildingData.id
    );
    boundOrangepis.value = Array.isArray(orangepiRes.data.data)
      ? orangepiRes.data.data
      : [];

    // 獲取綁定的 NVR - API 直接返回完整的 NVR 對象數組
    const nvrRes = await BuildingNvrBindApi.getByBuilding(
      props.buildingData.id
    );
    boundNvrs.value = Array.isArray(nvrRes.data.data) ? nvrRes.data.data : [];
  } catch (error) {
    console.error("加載綁定設備失敗:", error);
    message.error("加載綁定設備失敗");
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible && props.buildingData) {
      loadBoundDevices();
      orangepiPagination.value = { current: 1, pageSize: 5 };
      nvrPagination.value = { current: 1, pageSize: 5 };
      activeTab.value = "orangepi";
    }
  }
);

const paginate = <T>(
  items: T[] | undefined,
  current: number,
  pageSize: number
) => {
  const list = items ?? [];
  const start = (current - 1) * pageSize;
  return list.slice(start, start + pageSize);
};

const pagedOrangepis = computed(() =>
  paginate(
    boundOrangepis.value,
    orangepiPagination.value.current,
    orangepiPagination.value.pageSize
  )
);

const pagedNvrs = computed(() =>
  paginate(
    boundNvrs.value,
    nvrPagination.value.current,
    nvrPagination.value.pageSize
  )
);

const handleOrangepiChange: TableProps["onChange"] = (pagination) => {
  if (!pagination) return;
  orangepiPagination.value = {
    current: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? orangepiPagination.value.pageSize,
  };
};

const handleNvrChange: TableProps["onChange"] = (pagination) => {
  if (!pagination) return;
  nvrPagination.value = {
    current: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? nvrPagination.value.pageSize,
  };
};

// 解綁 OrangePi
const unbindOrangepi = async (id: number) => {
  try {
    await BuildingBindApi.unbind({ orangepi_id: id });
    message.success("解綁成功");
    await loadBoundDevices();
    emit("updated");
  } catch (error) {
    message.error("解綁失敗");
  }
};

// 解綁 NVR
const unbindNvr = async (id: number) => {
  try {
    await BuildingNvrBindApi.unbind({ nvr_id: id });
    message.success("解綁成功");
    await loadBoundDevices();
    emit("updated");
  } catch (error) {
    message.error("解綁失敗");
  }
};

const showBindDialog = (type: "orangepi" | "nvr") => {
  bindDialogType.value = type;
  isBindDialogVisible.value = true;
};

const handleBindSuccess = () => {
  loadBoundDevices();
  emit("updated");
};

const handleCancel = () => {
  emit("update:visible", false);
};

const orangepiColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "設備名稱", dataIndex: "name", key: "name" },
  { title: "iSmart ID", dataIndex: "ismartid", key: "ismartid" },
  {
    title: "認證端口",
    dataIndex: "icctv_auth_service_remote_port",
    key: "icctv_auth_service_remote_port",
  },
  { title: "SSH端口", dataIndex: "ssh_remote_port", key: "ssh_remote_port" },
  { title: "啟用", dataIndex: "is_active", key: "is_active" },
  { title: "更新時間", dataIndex: "updatedAt", key: "updatedAt", width: 180 },
  { title: "操作", key: "action", width: 100 },
];

const nvrColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "名稱", dataIndex: "name", key: "name" },
  { title: "訪問地址", dataIndex: "url", key: "url" },
  { title: "管理員賬號", dataIndex: ["admin_user", "name"], key: "admin_user" },
  {
    title: "管理員密碼",
    dataIndex: ["admin_user", "password"],
    key: "admin_password",
  },
  { title: "更新日期", dataIndex: "updatedAt", key: "updatedAt", width: 180 },
  { title: "操作", key: "action", width: 100 },
];
</script>

<template>
  <a-modal
    :open="props.visible"
    :title="props.buildingData?.name || '建築詳情'"
    width="900px"
    :footer="null"
    @cancel="handleCancel"
  >
    <a-tabs v-model:activeKey="activeTab">
      <template #tabBarExtraContent>
        <div class="flex gap-2">
          <a-button
            v-if="activeTab === 'orangepi'"
            type="primary"
            @click="showBindDialog('orangepi')"
          >
            添加 OrangePi
          </a-button>
          <a-button
            v-if="activeTab === 'nvr'"
            type="primary"
            @click="showBindDialog('nvr')"
          >
            添加 NVR
          </a-button>
        </div>
      </template>
      <a-tab-pane
        key="orangepi"
        tab="OrangePi 設備"
      >
        <a-table
          :data-source="pagedOrangepis"
          :columns="orangepiColumns"
          :loading="isLoading"
          row-key="id"
          :pagination="{
            current: orangepiPagination.current,
            pageSize: orangepiPagination.pageSize,
            total: boundOrangepis.length,
            showSizeChanger: true,
          }"
          @change="handleOrangepiChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'is_active'">
              <a-tag :color="record.is_active ? 'green' : 'red'">
                {{ record.is_active ? "啟用" : "停用" }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <a-button
                type="link"
                danger
                size="small"
                @click="unbindOrangepi(record.id)"
              >
                解綁
              </a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
      <a-tab-pane
        key="nvr"
        tab="NVR 設備"
      >
        <a-table
          :data-source="pagedNvrs"
          :columns="nvrColumns"
          :loading="isLoading"
          row-key="id"
          :pagination="{
            current: nvrPagination.current,
            pageSize: nvrPagination.pageSize,
            total: boundNvrs.length,
            showSizeChanger: true,
          }"
          @change="handleNvrChange"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'action'">
              <a-button
                type="link"
                danger
                size="small"
                @click="unbindNvr(record.id)"
              >
                解綁
              </a-button>
            </template>
          </template>
        </a-table>
      </a-tab-pane>
    </a-tabs>

    <BindDeviceDialog
      :visible="isBindDialogVisible"
      :building-id="props.buildingData?.id"
      :type="bindDialogType"
      :bound-ids="bindDialogType === 'orangepi' ? boundOrangepis.map(o => o.id) : boundNvrs.map(n => n.id)"
      @update:visible="isBindDialogVisible = $event"
      @success="handleBindSuccess"
    />
  </a-modal>
</template>


