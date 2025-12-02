<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message } from "ant-design-vue";
import {
  DeviceApi,
  NvrApi,
  BuildingBindApi,
  BuildingNvrBindApi,
} from "@/httpapis/api";
import type { Device } from "@/model/device";
import type { Nvr } from "@/model/nvr";

const props = defineProps<{
  visible: boolean;
  buildingId?: number;
  type: "orangepi" | "nvr";
  boundIds: number[];
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

const selectedIds = ref<number[]>([]);
const allDevices = ref<Device[]>([]);
const allNvrs = ref<Nvr[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);

// 可用的設備（排除已綁定的）
const availableDevices = computed(() => {
  if (props.type === "orangepi") {
    return allDevices.value.filter((d) => !props.boundIds.includes(d.id));
  } else {
    return allNvrs.value.filter((n) => !props.boundIds.includes(n.id));
  }
});

// 加載所有設備
const loadAllDevices = async () => {
  isLoading.value = true;
  try {
    if (props.type === "orangepi") {
      const response = await DeviceApi.list();
      allDevices.value = response.data.data;
    } else {
      const response = await NvrApi.list();
      allNvrs.value = Array.isArray(response.data.data)
        ? response.data.data
        : [];
    }
  } catch (error) {
    message.error("加載設備列表失敗");
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      selectedIds.value = [];
      loadAllDevices();
    }
  }
);

// 格式化 OrangePi 顯示
const formatOrangePi = (device: Device) => {
  return `ID: ${device.id} | ${device.name} | 認證端口: ${device.icctv_auth_service_remote_port} | SSH: ${device.ssh_remote_port}`;
};

// 格式化 NVR 顯示
const formatNvr = (nvr: Nvr) => {
  return `ID: ${nvr.id} | ${nvr.name} | ${nvr.url}`;
};

// 處理選擇變化
const handleSelect = (id: number) => {
  const index = selectedIds.value.indexOf(id);
  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

// 提交綁定
const handleSubmit = async () => {
  if (!props.buildingId || selectedIds.value.length === 0) {
    message.warning("請至少選擇一個設備");
    return;
  }

  isSubmitting.value = true;
  try {
    // 只綁定新選擇的設備，不需要先解綁已有的
    const bindPromises = selectedIds.value.map((id) => {
      if (props.type === "orangepi") {
        return BuildingBindApi.bind({
          building_id: props.buildingId!,
          orangepi_id: id,
        });
      } else {
        return BuildingNvrBindApi.bind({
          building_id: props.buildingId!,
          nvr_id: id,
        });
      }
    });
    await Promise.all(bindPromises);

    message.success("綁定成功");
    emit("success");
    emit("update:visible", false);
  } catch (error) {
    message.error("綁定失敗");
  } finally {
    isSubmitting.value = false;
  }
};

const handleCancel = () => {
  emit("update:visible", false);
};
</script>

<template>
  <a-modal
    :open="props.visible"
    :title="`添加 ${type === 'orangepi' ? 'OrangePi 設備' : 'NVR 設備'}`"
    width="700px"
    @cancel="handleCancel"
  >
    <a-spin :spinning="isLoading">
      <div class="space-y-2 max-h-96 overflow-y-auto">
        <div
          v-for="device in availableDevices"
          :key="device.id"
          class="p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-400"
          :class="{
            'bg-gray-100 border-blue-500': selectedIds.includes(device.id),
            'bg-white': !selectedIds.includes(device.id),
          }"
          @click="handleSelect(device.id)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm">
              {{ type === 'orangepi' ? formatOrangePi(device as Device) : formatNvr(device as Nvr) }}
            </span>
            <a-tag
              v-if="selectedIds.includes(device.id)"
              color="blue"
            >
              <template #icon>
                <span>✓</span>
              </template>
              已選
            </a-tag>
          </div>
        </div>

        <a-empty
          v-if="availableDevices.length === 0"
          description="暫無可用設備"
        />
      </div>
    </a-spin>

    <template #footer>
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-500">
          已選擇 {{ selectedIds.length }} 個設備
        </span>
        <div class="space-x-2">
          <a-button @click="handleCancel">取消</a-button>
          <a-button
            type="primary"
            :loading="isSubmitting"
            :disabled="selectedIds.length === 0"
            @click="handleSubmit"
          >
            確認綁定
          </a-button>
        </div>
      </div>
    </template>
  </a-modal>
</template>
