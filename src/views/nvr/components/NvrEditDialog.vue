<script setup lang="ts">
import { computed, h, ref, watch } from "vue";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons-vue";
import { message, Modal } from "ant-design-vue";
import type { Nvr } from "@/model/nvr";
import type { Building } from "@/model/building";
import type { Device } from "@/model/device";
import type { RTSPSource } from "@/model/rtspSource";
import { RTSPSourceApi } from "@/httpapis/apis/rtspSource";
import { BuildingApi, DeviceApi, OrangePiRemoteApi } from "@/httpapis/api";
import { useNvrData, type RTSPPathInput } from "../useNvr";
import { channelPathError, isChannelPath, nextChannelPath, remapConflictingChannelPaths, reservedChannelPaths, sortChannelPaths } from "../../orangepi/channelCatalogue";
import { assignRTSPChannelNames, createRTSPImportItems, listAllRTSPPaths } from "../../orangepi/rtspGroupImport";

const props = defineProps<{
  visible: boolean;
  mode: "create" | "edit";
  nvrData?: Nvr;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  created: [];
  updated: [];
  cancel: [];
}>();

const { create, update } = useNvrData();
const formRef = ref();
const isLoading = ref(false);
const buildings = ref<Building[]>([]);
const devices = ref<Device[]>([]);
const sources = ref<RTSPSource[]>([]);
const sourceLoadError = ref(false);
const selectedSourceIDs = ref<number[]>([]);
const addSourcePickerOpen = ref(false);
const sourceOptions = computed(() => sources.value.map((source) => ({
  value: source.id,
  label: `#${source.id} ${source.remark ? `${source.remark} / ` : ""}${source.url} / ${source.building?.name || "未指定大廈"}`,
  title: source.url,
})));
const sourceOptionFor = (item: RTSPPathInput) => {
  if (!item.source_id || sources.value.some((source) => source.id === item.source_id)) return sourceOptions.value;
  return [{ value: item.source_id, label: item.remark || item.url, title: item.url }, ...sourceOptions.value];
};
const formData = ref<{ id?: number; name: string; building_id: number; orangepi_id: number; paths: RTSPPathInput[] }>({
  name: "",
  building_id: 0,
  orangepi_id: 0,
  paths: [],
});

const defaultPath = (channel: number): RTSPPathInput => ({
  channel,
  path: `channel${channel}`,
  url: "",
  remark: "",
});

const resetForm = () => {
  if (props.mode === "edit" && props.nvrData) {
    const items = createRTSPImportItems(props.nvrData.rtsp_urls || []);
    assignRTSPChannelNames(items, {}, []);
    formData.value = {
      id: props.nvrData.id,
      name: props.nvrData.name,
      building_id: props.nvrData.building_id || 0,
      orangepi_id: props.nvrData.orangepi_id || 0,
      paths: sortChannelPaths(items.map((item) => ({
        id: props.nvrData?.rtsp_urls?.[item.key]?.id,
        source_id: props.nvrData?.rtsp_urls?.[item.key]?.source_id,
        channel: Number(item.name.slice(7)),
        path: item.name,
        url: item.source,
        remark: item.remark,
        visible: props.nvrData?.rtsp_urls?.[item.key]?.visible !== false,
      }))),
    };
  } else {
    formData.value = { name: "", building_id: 0, orangepi_id: 0, paths: [] };
  }
  selectedSourceIDs.value = [];
  addSourcePickerOpen.value = false;
};

watch(() => props.visible, (visible) => {
  if (visible) {
    resetForm();
    void loadOptions();
  }
  else isLoading.value = false;
}, { immediate: true });

const loadOptions = async () => {
  try {
    sourceLoadError.value = false;
    const [buildingResponse, deviceResponse, sourceResponse] = await Promise.all([BuildingApi.list(), DeviceApi.list(), RTSPSourceApi.list()]);
    buildings.value = (buildingResponse.data.data || []) as Building[];
    devices.value = (deviceResponse.data.data || []) as Device[];
    sources.value = sourceResponse.data.data;
    for (const path of formData.value.paths) {
      const source = sources.value.find((item) => item.id === path.source_id);
      if (source) path.url = source.url;
    }
  } catch (error: any) {
    sourceLoadError.value = true;
    message.error(`加载绑定选项失败: ${error.response?.data?.error || error.message}`);
  }
};

const addPath = () => {
  try {
    for (const id of selectedSourceIDs.value) {
      const source = sources.value.find((item) => item.id === id);
      if (!source) continue;
      const name = nextChannelPath(formData.value.paths.map((item) => item.path || ""));
      formData.value.paths.push({
        ...defaultPath(Number(name.slice(7))),
        source_id: source.id, url: source.url, remark: source.remark, visible: true,
      });
    }
    selectedSourceIDs.value = [];
    addSourcePickerOpen.value = false;
  } catch (error: any) {
    message.error(error.message);
  }
};

const replaceSource = (item: RTSPPathInput, id: number) => {
  const source = sources.value.find((candidate) => candidate.id === id);
  if (!source) return;
  item.source_id = source.id;
  item.url = source.url;
  item.remark = source.remark;
};

const removePath = (index: number) => {
  const path = formData.value.paths[index];
  if (!path) return;
  Modal.confirm({
    title: `从 RTSP 组移除 ${path.path || "此摄像头"}？`,
    content: "保存後將解除此組對地址的引用，RTSP 清單仍保留該地址。大廈 V2 後續授權會移除此攝像頭；已由此組成功同步、未被其他組引用且 source 核對一致的設備 Path 會刪除。",
    okText: "移除摄像头",
    okType: "danger",
    cancelText: "取消",
    onOk: () => {
      const currentIndex = formData.value.paths.indexOf(path);
      if (currentIndex >= 0) formData.value.paths.splice(currentIndex, 1);
    },
  });
};

const normalizePaths = (): RTSPPathInput[] =>
  formData.value.paths.map((item) => {
    const path = item.path?.trim() || "";
    return {
      channel: isChannelPath(path) ? Number(path.slice(7)) : 0,
      path,
      url: item.url.trim(),
      remark: item.remark?.trim() || "",
      id: item.id,
      source_id: item.source_id,
      visible: item.visible !== false,
    };
  });

const validatePaths = (paths: RTSPPathInput[]) => {
  if (paths.length === 0 && props.mode === "create") return "請至少添加一個 RTSP Path";
  const names = new Set<string>();
  for (const item of paths) {
    if (!isChannelPath(item.path || "")) return channelPathError;
    if (!item.source_id) return `請從 RTSP 清單選擇「${item.path}」的地址`;
    const key = item.path!;
    if (names.has(key)) return `Path「${item.path}」重複`;
    names.add(key);
    if (!/^rtsps?:\/\//i.test(item.url)) return `Path「${item.path}」需要有效的 RTSP 地址`;
  }
  return "";
};

const confirmPathConflicts = async (paths: RTSPPathInput[]) => {
  if (!formData.value.building_id && !formData.value.orangepi_id) return paths;
  const building = buildings.value.find((item) => item.id === formData.value.building_id);
  const device = devices.value.find((item) => item.id === formData.value.orangepi_id);
  if (!building || !device) throw new Error("請先選擇有效的大廈和 OrangePi");

  const remotePaths = await listAllRTSPPaths(async (page) => {
    const response = await OrangePiRemoteApi.previewPaths({
      id: device.id,
      ismartid: building.ismartid,
      page,
      items_per_page: 50,
    });
    return response.data.data;
  }, 50);
  const reserved = reservedChannelPaths(device, remotePaths);
  const managedPaths = props.nvrData?.orangepi_id === device.id
    ? (props.nvrData.rtsp_urls || [])
      .filter((item) => item.sync_status === "success" && item.synced_orangepi_id === device.id)
      .map((item) => item.path || "")
    : [];
  const changes = remapConflictingChannelPaths(
    paths.map((item) => item.path || ""),
    reserved,
    managedPaths,
  );
  if (changes.length === 0) return paths;

  const confirmed = await new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: "发现 OrangePi Path 冲突",
      content: h("div", { class: "space-y-1" }, [
        h("p", "以下摄像头将改用未占用的末尾频道。确认后会更新 RTSP 组并创建新 Path；设备上的旧 Path 会保留。"),
        ...changes.map(({ from, to }) =>
          h("div", { class: "font-mono" }, `${from} → ${to}`),
        ),
      ]),
      okText: "确认并重分配",
      cancelText: "返回检查",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
  if (!confirmed) return null;

  const mapping = new Map(changes.map(({ from, to }) => [from, to]));
  return paths.map((item) => {
    const path = mapping.get(item.path || "");
    return path ? { ...item, path, channel: Number(path.slice(7)) } : item;
  });
};

const handleOk = async () => {
  if (isLoading.value) return;
  let savingGroup = false;
  try {
    if (sourceLoadError.value) {
      message.error("請先重新載入 RTSP 清單");
      return;
    }
    await formRef.value.validate();
    if (Boolean(formData.value.building_id) !== Boolean(formData.value.orangepi_id)) {
      message.warning("請同時綁定大廈及 OrangePi，或將兩項設為未綁定");
      return;
    }
    if (props.nvrData?.orangepi_id && !formData.value.orangepi_id) {
      const confirmed = await new Promise<boolean>((resolve) => Modal.confirm({
        title: "解除大廈及 OrangePi 綁定？",
        content: "此組將停止自動同步，後續 V2 授權不再使用此組。原設備 Path 和 RTSP 清單地址會保留。",
        okText: "解除綁定",
        cancelText: "取消",
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      }));
      if (!confirmed) return;
    }
    let paths = normalizePaths();
    const error = validatePaths(paths);
    if (error) {
      message.warning(error);
      return;
    }
    isLoading.value = true;
    const resolvedPaths = await confirmPathConflicts(paths);
    if (!resolvedPaths) return;
    paths = resolvedPaths;
    formData.value.paths = paths;
    savingGroup = true;
    if (props.mode === "edit" && formData.value.id) {
      await update({
        name: formData.value.name.trim(),
        building_id: formData.value.building_id,
        orangepi_id: formData.value.orangepi_id,
        rtsp_urls: paths,
      }, formData.value.id);
      emit("updated");
    } else {
      await create({
        name: formData.value.name.trim(),
        building_id: formData.value.building_id,
        orangepi_id: formData.value.orangepi_id,
        rtsp_urls: paths,
      });
      emit("created");
    }
    emit("update:visible", false);
  } catch (error: any) {
    if (!savingGroup && !error?.errorFields) {
      message.error(error.response?.data?.error || error.message || "保存 RTSP 組失敗");
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <a-modal
    :open="visible"
    :title="mode === 'create' ? '新增 RTSP 組' : '編輯 RTSP 組'"
    width="min(980px, calc(100vw - 32px))"
    :mask-closable="false"
    :confirm-loading="isLoading"
    ok-text="保存"
    cancel-text="取消"
    :ok-button-props="{ 'aria-label': '保存 RTSP 組' }"
    @ok="handleOk"
    @cancel="!isLoading && emit('update:visible', false)"
  >
    <a-form ref="formRef" name="rtsp-group" :model="formData" :disabled="isLoading" layout="vertical">
      <a-form-item
        label="組名稱"
        name="name"
        :rules="[{ required: true, whitespace: true, message: '請輸入組名稱' }]"
      >
        <a-input v-model:value="formData.name" placeholder="例如：時安大廈 8 路鏡頭" />
      </a-form-item>

      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <a-form-item
          label="綁定大廈"
          name="building_id"
          :rules="[{ required: true, type: 'number', min: 0, message: '請選擇大廈' }]"
        >
          <a-select v-model:value="formData.building_id" aria-label="綁定大廈" placeholder="选择大厦">
            <a-select-option :value="0">未綁定</a-select-option>
            <a-select-option v-for="building in buildings" :key="building.id" :value="building.id">
              {{ building.name }}（{{ building.ismartid }}）
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item
          label="綁定 OrangePi"
          name="orangepi_id"
          :rules="[{ required: true, type: 'number', min: 0, message: '請選擇 OrangePi' }]"
        >
          <a-select v-model:value="formData.orangepi_id" aria-label="綁定 OrangePi" placeholder="选择 OrangePi">
            <a-select-option :value="0">未綁定</a-select-option>
            <a-select-option v-for="device in devices" :key="device.id" :value="device.id">
              {{ device.name }}（ID {{ device.id }}）
            </a-select-option>
          </a-select>
        </a-form-item>
      </div>

      <div class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 pb-2">
        <span class="font-medium">RTSP Paths</span>
        <div class="flex w-full flex-wrap gap-2 md:w-auto">
          <label for="rtsp-group-add-sources" class="sr-only">從 RTSP 清單添加地址</label>
          <a-select
            id="rtsp-group-add-sources"
            v-model:value="selectedSourceIDs"
            :open="addSourcePickerOpen"
            mode="multiple" show-search option-filter-prop="label"
            :options="sourceOptions" :max-tag-count="2"
            :disabled="sourceLoadError"
            class="min-w-0 flex-1 md:w-80"
            placeholder="從 RTSP 清單選擇地址"
            aria-label="從 RTSP 清單添加地址"
            @dropdown-visible-change="addSourcePickerOpen = $event"
          />
          <a-button aria-label="添加" :disabled="!selectedSourceIDs.length || sourceLoadError" @click="addPath">
            <template #icon><PlusOutlined /></template>
            添加
          </a-button>
        </div>
      </div>
      <a-alert v-if="sourceLoadError" type="error" message="載入 RTSP 清單失敗" show-icon class="mb-3">
        <template #action><a-button size="small" @click="loadOptions">重試</a-button></template>
      </a-alert>

      <div class="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        <div class="hidden grid-cols-[110px_minmax(0,1fr)_150px_70px_40px] gap-2 px-1 text-xs text-muted md:grid">
          <span>Path 名稱</span>
          <span>RTSP 地址</span>
          <span>說明</span>
          <span>可见</span>
          <span></span>
        </div>
        <div
          v-for="(item, index) in formData.paths"
          :key="index"
          class="grid grid-cols-1 items-center gap-2 border-b border-gray-100 pb-3 md:grid-cols-[110px_minmax(0,1fr)_150px_70px_40px] md:border-0 md:pb-0"
        >
          <a-input
            v-model:value="item.path"
            :aria-label="`第 ${index + 1} 個 Path 名稱`"
            :status="isChannelPath(item.path || '') ? undefined : 'error'"
            disabled
            placeholder="channel1"
          />
          <div class="min-w-0">
            <label :for="`rtsp-group-source-${index}`" class="sr-only">第 {{ index + 1 }} 個 RTSP 地址</label>
            <a-select
              :id="`rtsp-group-source-${index}`"
              :value="item.source_id" :options="sourceOptionFor(item)"
              show-search option-filter-prop="label" class="w-full"
              :disabled="sourceLoadError"
              :aria-label="`第 ${index + 1} 個 RTSP 地址`"
              placeholder="選擇 RTSP 地址"
              @change="replaceSource(item, Number($event))"
            />
            <div class="mt-1 break-all font-mono text-xs text-gray-500">{{ item.url }}</div>
          </div>
          <a-input v-model:value="item.remark" placeholder="說明" />
          <a-switch v-model:checked="item.visible" checked-children="可见" un-checked-children="隐藏" />
          <a-tooltip title="從組中移除">
            <a-button class="justify-self-end" type="text" danger shape="circle" :aria-label="`從組中移除 ${item.path}`" @click="removePath(index)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
        <a-empty v-if="formData.paths.length === 0" description="暫無 RTSP Path" />
      </div>
    </a-form>
  </a-modal>
</template>
