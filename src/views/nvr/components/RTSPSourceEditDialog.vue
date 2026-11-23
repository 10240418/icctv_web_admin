<script setup lang="ts">
import { computed, h, ref, watch } from "vue";
import { Modal, message } from "ant-design-vue";
import { BuildingApi } from "@/httpapis/api";
import { RTSPSourceApi } from "@/httpapis/apis/rtspSource";
import type { Building } from "@/model/building";
import type { RTSPSource, RTSPSourceInput } from "@/model/rtspSource";

const props = defineProps<{ visible: boolean; source?: RTSPSource }>();
const emit = defineEmits<{ "update:visible": [value: boolean]; saved: [] }>();
const formRef = ref();
const saving = ref(false);
const buildings = ref<Building[]>([]);
const form = ref<RTSPSourceInput>({ url: "", remark: "", building_id: 0 });
const buildingOptions = computed(() => [
  { value: 0, label: "未指定大廈" },
  ...buildings.value.map((building) => ({ value: building.id, label: building.name })),
]);

watch(() => props.visible, async (visible) => {
  if (!visible) return;
  form.value = {
    url: props.source?.url || "",
    remark: props.source?.remark || "",
    building_id: props.source?.building_id || 0,
  };
  formRef.value?.clearValidate();
  try {
    const response = await BuildingApi.list();
    buildings.value = response.data.data as Building[];
  } catch {
    message.error("載入大廈選項失敗");
  }
});

const save = async () => {
  if (saving.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  const payload = { ...form.value, url: form.value.url.trim(), remark: form.value.remark.trim() };
  const source = props.source;
  if (source && payload.url !== source.url && source.usages.length) {
    const groups = [...new Map(source.usages.map((usage) => [usage.group_id, usage.group_name])).values()];
    const confirmed = await new Promise<boolean>((resolve) => Modal.confirm({
      title: "更新使用此地址的 RTSP 組？",
      content: h("div", [
        h("p", "保存後以下組會使用新地址，並同步至各組綁定的 OrangePi："),
        ...groups.map((name) => h("p", { class: "break-all" }, name)),
      ]),
      okText: "確認更新及同步",
      cancelText: "取消",
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    }));
    if (!confirmed) return;
  }
  saving.value = true;
  try {
    if (source) {
      const response = await RTSPSourceApi.update(source.id, {
        ...payload,
        expected_version: source.updatedAt || "",
        confirmed_groups: [...new Set(source.usages.map((usage) => usage.group_id))],
      });
      const errors = response.data.data.sync_errors;
      if (errors.length) {
        Modal.warning({
          title: "地址已保存，部分組尚未完成同步",
          content: h("div", errors.map((error) => h("p", { class: "break-all" }, error))),
          okText: "知道了",
        });
      } else message.success("RTSP 地址已更新");
    } else {
      await RTSPSourceApi.create(payload);
      message.success("RTSP 地址已新增");
    }
    emit("saved");
    emit("update:visible", false);
  } catch (error: any) {
    if (error.code === "ECONNABORTED" || !error.response) {
      message.error("連線中斷，請重新整理確認地址保存及同步結果");
      emit("saved");
    } else message.error(error.response?.data?.error || "保存 RTSP 地址失敗");
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <a-modal
    :open="visible"
    :title="source ? '編輯 RTSP 地址' : '新增 RTSP 地址'"
    width="min(620px, calc(100vw - 32px))"
    :mask-closable="false"
    :confirm-loading="saving"
    ok-text="保存"
    :ok-button-props="{ 'aria-label': '保存' }"
    cancel-text="取消"
    @ok="save"
    @cancel="!saving && emit('update:visible', false)"
  >
    <a-form ref="formRef" name="rtsp-source" :model="form" :disabled="saving" layout="vertical">
      <a-form-item
        label="RTSP 地址" name="url"
        :rules="[{ required: true, whitespace: true, message: '請輸入 RTSP 地址' }, { pattern: /^rtsps?:\/\/[^/\s]+(?:\/.*)?$/i, message: '請輸入有效的 rtsp:// 或 rtsps:// 地址' }]"
      >
        <a-input v-model:value="form.url" aria-label="RTSP 地址" autocomplete="off" placeholder="rtsp://host:554/stream" />
      </a-form-item>
      <a-form-item label="所屬大廈" name="building_id">
        <a-select v-model:value="form.building_id" :options="buildingOptions" show-search option-filter-prop="label" aria-label="地址所屬大廈" />
      </a-form-item>
      <a-form-item label="標註說明" name="remark">
        <a-textarea v-model:value="form.remark" aria-label="標註說明" :rows="3" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>
