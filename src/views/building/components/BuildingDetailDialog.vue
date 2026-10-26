<script setup lang="ts">
import { catalogueChannels, channelLabel } from "@/views/orangepi/channelCatalogue";
import { computed, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { SaveOutlined } from "@ant-design/icons-vue";
import type { Building } from "@/model/building";
import type { TableProps } from "ant-design-vue";
import { BuildingBindApi } from "@/httpapis/api";
import type { Device } from "@/model/device";
import BindDeviceDialog from "./BindDeviceDialog.vue";

const props = defineProps<{
  visible: boolean;
  buildingData?: Building;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  updated: [];
}>();

const orangepiPagination = ref({ current: 1, pageSize: 5 });
const boundOrangepis = ref<Device[]>([]);
const isLoading = ref(false);
const isBindDialogVisible = ref(false);
const channelDrafts = ref<Record<number, number[]>>({});
const savingChannelDeviceId = ref<number | null>(null);

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
    channelDrafts.value = Object.fromEntries(
      boundOrangepis.value.map((device) => [
        device.id,
        [...(
          device.building_channels?.length
            ? device.building_channels
            : device.all_channels?.length
              ? device.all_channels
              : device.user_channels || []
        )],
      ])
    );

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

const handleOrangepiChange: TableProps["onChange"] = (pagination) => {
  if (!pagination) return;
  orangepiPagination.value = {
    current: pagination.current ?? 1,
    pageSize: pagination.pageSize ?? orangepiPagination.value.pageSize,
  };
};

// 解綁 OrangePi
const unbindOrangepi = async (id: number) => {
  try {
    await BuildingBindApi.unbind({
      building_id: props.buildingData?.id,
      orangepi_id: id,
    });
    message.success("解綁成功");
    await loadBoundDevices();
    emit("updated");
  } catch (error) {
    message.error("解綁失敗");
  }
};

const channelOptionsFor = (device: Device) => {
  return catalogueChannels(device).map((channel) => ({
    label: device.channel_remarks?.[`channel${channel}`]
      ? `${channelLabel(device, channel)} - ${device.channel_remarks[`channel${channel}`]}`
      : channelLabel(device, channel),
    value: channel,
  }));
};

const saveBuildingChannels = async (device: Device) => {
  const channels = channelDrafts.value[device.id] || [];
  if (!props.buildingData?.id || channels.length === 0) {
    message.warning("請至少保留一個可見頻道");
    return;
  }
  savingChannelDeviceId.value = device.id;
  try {
    await BuildingBindApi.updateChannels({
      building_id: props.buildingData.id,
      orangepi_id: device.id,
      channels,
    });
    message.success("大廈可見頻道已更新");
    await loadBoundDevices();
  } catch (error: any) {
    message.error(error.response?.data?.error || "更新頻道失敗");
  } finally {
    savingChannelDeviceId.value = null;
  }
};

const showBindDialog = () => {
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
  { title: "大廈可見頻道", key: "building_channels", width: 300 },
  { title: "更新時間", dataIndex: "updatedAt", key: "updatedAt", width: 180 },
  { title: "操作", key: "action", width: 130 },
];

</script>

<template>
  <a-modal
    :open="props.visible"
    :title="props.buildingData?.name || '建築詳情'"
    width="1100px"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="mb-4 flex items-center justify-between">
      <span class="text-base font-medium">OrangePi 設備</span>
      <a-button type="primary" @click="showBindDialog">
        添加 OrangePi
      </a-button>
    </div>
    <a-table
      :data-source="pagedOrangepis"
      :columns="orangepiColumns"
      :loading="isLoading"
      row-key="id"
      :scroll="{ x: 1100 }"
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
        <template v-else-if="column.key === 'building_channels'">
          <a-select
            v-model:value="channelDrafts[record.id]"
            mode="multiple"
            class="w-full"
            placeholder="選擇可見頻道"
            :options="channelOptionsFor(record)"
            option-filter-prop="label"
            max-tag-count="responsive"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="flex items-center gap-1">
            <a-tooltip title="保存可見頻道">
              <a-button
                type="primary"
                size="small"
                :loading="savingChannelDeviceId === record.id"
                aria-label="保存可見頻道"
                @click="saveBuildingChannels(record)"
              >
                <template #icon><SaveOutlined /></template>
                保存
              </a-button>
            </a-tooltip>
            <a-button
              type="link"
              danger
              size="small"
              @click="unbindOrangepi(record.id)"
            >
              解綁
            </a-button>
          </div>
        </template>
      </template>
    </a-table>

    <BindDeviceDialog
      :visible="isBindDialogVisible"
      :building-id="props.buildingData?.id"
      :bound-ids="boundOrangepis.map((orangepi) => orangepi.id)"
      @update:visible="isBindDialogVisible = $event"
      @success="handleBindSuccess"
    />
  </a-modal>
</template>
