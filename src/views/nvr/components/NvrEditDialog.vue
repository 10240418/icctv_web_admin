<script setup lang="ts">
import { ref, watch } from "vue";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import type { Nvr } from "@/model/nvr";
import { useNvrData, type RTSPPathInput } from "../useNvr";

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
const formData = ref<{ id?: number; name: string; paths: RTSPPathInput[] }>({
  name: "",
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
    formData.value = {
      id: props.nvrData.id,
      name: props.nvrData.name,
      paths: (props.nvrData.rtsp_urls || []).map((item) => ({
        channel: item.channel,
        path: item.path || (item.channel ? `channel${item.channel}` : ""),
        url: item.url,
        remark: item.remark || "",
      })),
    };
  } else {
    formData.value = { name: "", paths: [defaultPath(1)] };
  }
};

watch(() => props.visible, (visible) => {
  if (visible) resetForm();
  else isLoading.value = false;
}, { immediate: true });

const addPath = () => {
  const used = new Set(formData.value.paths.map((item) => item.channel).filter(Boolean));
  let channel = 1;
  while (used.has(channel)) channel++;
  formData.value.paths.push(defaultPath(channel));
};

const removePath = (index: number) => {
  formData.value.paths.splice(index, 1);
};

const normalizePaths = () =>
  formData.value.paths.map((item) => {
    const path = item.path?.trim() || "";
    const match = path.match(/^channel(\d+)$/i);
    return {
      channel: match?.[1] ? Number(match[1]) : 0,
      path,
      url: item.url.trim(),
      remark: item.remark?.trim() || "",
    };
  });

const validatePaths = (paths: RTSPPathInput[]) => {
  if (paths.length === 0) return "請至少添加一個 RTSP Path";
  const names = new Set<string>();
  for (const item of paths) {
    if (!item.path) return "Path 名稱不能為空";
    if (/[\/\\\s?#]/.test(item.path)) return `Path「${item.path}」包含無效字符`;
    const key = item.path.toLowerCase();
    if (names.has(key)) return `Path「${item.path}」重複`;
    names.add(key);
    if (!/^rtsps?:\/\//i.test(item.url)) return `Path「${item.path}」需要有效的 RTSP 地址`;
  }
  return "";
};

const handleOk = async () => {
  if (isLoading.value) return;
  try {
    await formRef.value.validate();
    const paths = normalizePaths();
    const error = validatePaths(paths);
    if (error) {
      message.warning(error);
      return;
    }
    isLoading.value = true;
    if (props.mode === "edit" && formData.value.id) {
      await update({ name: formData.value.name.trim(), rtsp_urls: paths }, formData.value.id);
      emit("updated");
    } else {
      await create({ name: formData.value.name.trim(), rtsp_urls: paths });
      emit("created");
    }
    emit("update:visible", false);
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
    @ok="handleOk"
    @cancel="emit('update:visible', false)"
  >
    <a-form ref="formRef" :model="formData" layout="vertical">
      <a-form-item
        label="組名稱"
        name="name"
        :rules="[{ required: true, whitespace: true, message: '請輸入組名稱' }]"
      >
        <a-input v-model:value="formData.name" placeholder="例如：時安大廈 8 路鏡頭" />
      </a-form-item>

      <div class="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
        <span class="font-medium">RTSP Paths</span>
        <a-button @click="addPath">
          <template #icon><PlusOutlined /></template>
          添加 Path
        </a-button>
      </div>

      <div class="max-h-[460px] space-y-2 overflow-y-auto pr-1">
        <div class="hidden grid-cols-[150px_minmax(280px,1fr)_180px_40px] gap-2 px-1 text-xs text-muted md:grid">
          <span>Path 名稱</span>
          <span>RTSP 地址</span>
          <span>說明</span>
          <span></span>
        </div>
        <div
          v-for="(item, index) in formData.paths"
          :key="index"
          class="grid grid-cols-1 items-center gap-2 border-b border-gray-100 pb-3 md:grid-cols-[150px_minmax(280px,1fr)_180px_40px] md:border-0 md:pb-0"
        >
          <a-input v-model:value="item.path" placeholder="channel1" />
          <a-input v-model:value="item.url" placeholder="rtsp://host:554/path" />
          <a-input v-model:value="item.remark" placeholder="說明" />
          <a-tooltip title="刪除此 Path">
            <a-button class="justify-self-end" type="text" danger shape="circle" @click="removePath(index)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
        <a-empty v-if="formData.paths.length === 0" description="暫無 RTSP Path" />
      </div>
    </a-form>
  </a-modal>
</template>
