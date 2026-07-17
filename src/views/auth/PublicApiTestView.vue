<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { message } from "ant-design-vue";
import { CopyOutlined, PlayCircleOutlined } from "@ant-design/icons-vue";
import { AuthApi, BuildingApi } from "@/httpapis/api";
import type { Building } from "@/model/building";
import type {
  OrangePiTokenDataV2,
  PublicTokenResponse,
  PublicTokenV2Response,
} from "@/model/orangepi";

const buildings = ref<Building[]>([]);
const ismartid = ref("");
const isStaff = ref(true);
const isLoading = ref(false);
const apiVersion = ref<"v1" | "v2">("v2");
const responseData = ref<PublicTokenResponse | PublicTokenV2Response | null>(null);
const rawResponse = ref<unknown>(null);

const endpoint = computed(() =>
  apiVersion.value === "v2"
    ? `${window.location.origin}/api/auth/public/v2`
    : `${window.location.origin}/api/auth/public`
);
const requestBody = computed(() => ({
  ismartid: ismartid.value,
  is_staff: isStaff.value,
}));
const formattedResponse = computed(() =>
  rawResponse.value ? JSON.stringify(rawResponse.value, null, 2) : ""
);
const urlRows = computed(() =>
  (responseData.value?.orangepis || []).flatMap((orangePi) => {
    const remarks: Record<string, string> = "channel_remarks" in orangePi
      ? (orangePi as OrangePiTokenDataV2).channel_remarks
      : {};
    return orangePi.urls.map((url) => {
      const channel = new URL(url).pathname.replace(/^\//, "");
      return {
        key: `${orangePi.orangepi_id}-${url}`,
        device: orangePi.orangepi_name,
        channel,
        remark: remarks[channel] || "",
        url,
      };
    });
  })
);

const columns = computed(() => [
  { title: "設備", dataIndex: "device", key: "device", width: 180 },
  { title: "頻道", dataIndex: "channel", key: "channel", width: 110 },
  ...(apiVersion.value === "v2"
    ? [{ title: "頻道說明", dataIndex: "remark", key: "remark", width: 180 }]
    : []),
  { title: "URL", dataIndex: "url", key: "url", width: 620 },
  { title: "操作", key: "action", width: 72 },
]);

const loadBuildings = async () => {
  try {
    const response = await BuildingApi.list();
    buildings.value = response.data.data || [];
    if (!ismartid.value && buildings.value[0]) {
      ismartid.value = buildings.value[0].ismartid;
    }
  } catch (error: any) {
    message.error(error.response?.data?.error || "大廈列表加載失敗");
  }
};

const runTest = async () => {
  if (!ismartid.value) {
    message.warning("請選擇 iSmart ID");
    return;
  }
  isLoading.value = true;
  try {
    const response = apiVersion.value === "v2"
      ? await AuthApi.publicTokenV2(requestBody.value)
      : await AuthApi.publicToken(requestBody.value);
    responseData.value = response.data.data;
    rawResponse.value = response.data;
    message.success("請求成功");
  } catch (error: any) {
    responseData.value = null;
    rawResponse.value = error.response?.data || { error: error.message };
    message.error(error.response?.data?.error || "請求失敗");
  } finally {
    isLoading.value = false;
  }
};

watch(apiVersion, () => {
  responseData.value = null;
  rawResponse.value = null;
});

const copyText = async (value: string) => {
  await navigator.clipboard.writeText(value);
  message.success("已複製");
};

onMounted(loadBuildings);
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between border-b border-gray-300 pb-4">
      <div class="flex items-baseline gap-3">
        <h2 class="text-2xl font-semibold text-foreground">公開接口測試</h2>
        <p class="text-sm text-muted">Public API Test</p>
      </div>
    </div>

    <section class="grid gap-5 lg:grid-cols-[minmax(320px,420px)_1fr]">
      <div class="rounded-lg border border-gray-300 p-5">
        <div class="mb-5 space-y-2">
          <div class="text-xs font-medium text-gray-500">POST</div>
          <code class="block break-all text-sm text-gray-800">{{ endpoint }}</code>
        </div>

        <a-form layout="vertical">
          <a-form-item label="接口版本">
            <a-segmented
              v-model:value="apiVersion"
              block
              :options="[
                { label: 'V1 兼容接口', value: 'v1' },
                { label: 'V2 頻道備註', value: 'v2' },
              ]"
            />
          </a-form-item>
          <a-form-item label="iSmart ID" required>
            <a-select
              v-model:value="ismartid"
              show-search
              :options="buildings.map((building) => ({
                label: `${building.name} (${building.ismartid})`,
                value: building.ismartid,
              }))"
              option-filter-prop="label"
            />
          </a-form-item>
          <a-form-item label="員工權限">
            <a-switch v-model:checked="isStaff" />
          </a-form-item>
          <a-button
            type="primary"
            block
            :loading="isLoading"
            @click="runTest"
          >
            <template #icon><PlayCircleOutlined /></template>
            發送請求
          </a-button>
        </a-form>

        <div class="mt-5 border-t border-gray-200 pt-4">
          <div class="mb-2 text-xs font-medium text-gray-500">REQUEST BODY</div>
          <pre class="m-0 overflow-auto rounded-md bg-gray-50 p-3 text-xs">{{ JSON.stringify(requestBody, null, 2) }}</pre>
        </div>
      </div>

      <div class="min-w-0 rounded-lg border border-gray-300 p-5">
        <div class="mb-3 flex items-center justify-between">
          <span class="text-sm font-medium">JSON 響應</span>
          <a-tooltip title="複製 JSON">
            <a-button
              v-if="formattedResponse"
              type="text"
              shape="circle"
              aria-label="複製 JSON"
              @click="copyText(formattedResponse)"
            >
              <template #icon><CopyOutlined /></template>
            </a-button>
          </a-tooltip>
        </div>
        <pre class="m-0 h-[360px] overflow-auto rounded-md bg-gray-50 p-4 text-xs whitespace-pre-wrap break-all">{{ formattedResponse || "尚未發送請求" }}</pre>
      </div>
    </section>

    <section v-if="urlRows.length" class="space-y-3">
      <h3 class="text-base font-semibold">視頻 URL</h3>
      <a-table
        :columns="columns"
        :data-source="urlRows"
        :pagination="{ pageSize: 8, showSizeChanger: false }"
        row-key="key"
        :scroll="{ x: 900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'url'">
            <code
              class="block max-w-[620px] truncate text-xs"
              :title="record.url"
            >{{ record.url }}</code>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-tooltip title="複製 URL">
              <a-button
                type="text"
                shape="circle"
                aria-label="複製 URL"
                @click="copyText(record.url)"
              >
                <template #icon><CopyOutlined /></template>
              </a-button>
            </a-tooltip>
          </template>
        </template>
      </a-table>
    </section>
  </div>
</template>
