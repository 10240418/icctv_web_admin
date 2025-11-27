<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Building } from "@/model/building";
import type { TableProps } from "ant-design-vue";

const props = defineProps<{
  visible: boolean;
  buildingData?: Building;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

const activeTab = ref<"orangepi" | "nvr">("orangepi");
const orangepiPagination = ref({ current: 1, pageSize: 5 });
const nvrPagination = ref({ current: 1, pageSize: 5 });

watch(
  () => props.buildingData,
  () => {
    orangepiPagination.value = { current: 1, pageSize: 5 };
    nvrPagination.value = { current: 1, pageSize: 5 };
    activeTab.value = "orangepi";
  }
);

const paginate = <T,>(items: T[] | undefined, current: number, pageSize: number) => {
  const list = items ?? [];
  const start = (current - 1) * pageSize;
  return list.slice(start, start + pageSize);
};

const pagedOrangepis = computed(() =>
  paginate(
    props.buildingData?.orangepis,
    orangepiPagination.value.current,
    orangepiPagination.value.pageSize
  )
);

const pagedNvrs = computed(() =>
  paginate(props.buildingData?.nvrs, nvrPagination.value.current, nvrPagination.value.pageSize)
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

const handleCancel = () => {
  emit("update:visible", false);
};

const orangepiColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "设备名称", dataIndex: "name", key: "name" },
  { title: "iSmart ID", dataIndex: "ismartid", key: "ismartid" },
  {
    title: "认证端口",
    dataIndex: "icctv_auth_service_remote_port",
    key: "icctv_auth_service_remote_port",
  },
  { title: "SSH端口", dataIndex: "ssh_remote_port", key: "ssh_remote_port" },
  { title: "启用", dataIndex: "is_active", key: "is_active" },
  { title: "更新时间", dataIndex: "updatedAt", key: "updatedAt", width: 180 },
];

const nvrColumns = [
  { title: "ID", dataIndex: "id", key: "id", width: 80 },
  { title: "名称", dataIndex: "name", key: "name" },
  { title: "访问地址", dataIndex: "url", key: "url" },
  { title: "管理员账号", dataIndex: ["admin_user", "name"], key: "admin_user" },
  { title: "管理员密码", dataIndex: ["admin_user", "password"], key: "admin_password" },
  { title: "更新日期", dataIndex: "updatedAt", key: "updatedAt", width: 180 },
];
</script>

<template>
  <a-modal
    :open="props.visible"
    :title="props.buildingData?.name || '建筑详情'"
    width="900px"
    :footer="null"
    @cancel="handleCancel"
  >
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane key="orangepi" tab="OrangePi 设备">
        <a-table
          :data-source="pagedOrangepis"
          :columns="orangepiColumns"
          row-key="id"
          :pagination="{
            current: orangepiPagination.current,
            pageSize: orangepiPagination.pageSize,
            total: props.buildingData?.orangepis?.length || 0,
            showSizeChanger: true,
          }"
          @change="handleOrangepiChange"
        />
      </a-tab-pane>
      <a-tab-pane key="nvr" tab="NVR 设备">
        <a-table
          :data-source="pagedNvrs"
          :columns="nvrColumns"
          row-key="id"
          :pagination="{
            current: nvrPagination.current,
            pageSize: nvrPagination.pageSize,
            total: props.buildingData?.nvrs?.length || 0,
            showSizeChanger: true,
          }"
          @change="handleNvrChange"
        />
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>


