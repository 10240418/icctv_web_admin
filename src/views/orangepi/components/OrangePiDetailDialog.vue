<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import { CopyOutlined } from "@ant-design/icons-vue";
import type { Device } from "@/model/device";
import type { MediaMTXPath } from "@/model/orangepi";
import type { Nvr } from "@/model/nvr";
import { OrangePiRemoteApi, NvrApi } from "@/httpapis/api";
import { AuthApi } from "@/httpapis/api";

interface Props {
  visible: boolean;
  device?: Device;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
  refreshList: [];
}>();

const activeTab = ref("info");
const isLoading = ref(false);
const staffToken = ref<string>("");
const deviceInfo = ref<any>(null);
const healthInfo = ref<any>(null);
const pathsList = ref<MediaMTXPath[]>([]);
const pathsTotal = ref(0);
const currentPage = ref(0);
const pageSize = ref(50);
const isLoadingPaths = ref(false); // 單獨的 paths 加載狀態

// 新增/編輯 Path 相關
const isPathDialogVisible = ref(false);
const pathDialogMode = ref<"add" | "edit">("add");
const selectedPathName = ref("");
const pathFormData = ref({
  name: "",
  source: "",
  sourceOnDemand: false,
  record: false,
  recordPath: "./recordings/%path/%Y-%m-%d_%H-%M-%S",
  recordPartDuration: "30m",
});

// 同步NVR 相關
const isSyncNvrDialogVisible = ref(false);
const allNvrs = ref<Nvr[]>([]);
const selectedNvrId = ref<number | null>(null);
const isLoadingNvrs = ref(false);
const isSyncing = ref(false);

const columns = [
  { title: "Path名稱", dataIndex: "name", key: "name", width: 120 },
  {
    title: "RTSP地址",
    dataIndex: "source",
    key: "source",
    width: 300,
    ellipsis: true,
  },
  {
    title: "狀態",
    dataIndex: "ready",
    key: "ready",
    width: 80,
  },
  { title: "就緒時間", dataIndex: "readyTime", key: "readyTime", width: 180 },
  { title: "操作", key: "action", width: 150 },
];

const dialogTitle = computed(() => {
  return props.device ? `${props.device.name} - 遠程管理` : "設備詳情";
});

watch(
  () => props.visible,
  async (newVal) => {
    if (newVal && props.device) {
      await initializeData();
    } else {
      resetData();
    }
  }
);

const resetData = () => {
  activeTab.value = "info";
  staffToken.value = "";
  deviceInfo.value = null;
  healthInfo.value = null;
  pathsList.value = [];
  pathsTotal.value = 0;
  currentPage.value = 0;
};

const initializeData = async () => {
  if (!props.device) {
    message.error("設備信息為空");
    return;
  }

  if (!props.device.ismartid) {
    message.error("設備缺少ISmartID信息");
    return;
  }

  isLoading.value = true;
  try {
    console.log("Initializing with device:", props.device);

    // 生成 Staff Token
    await generateStaffToken();

    // 加載設備信息和健康檢查
    await Promise.all([loadDeviceInfo(), loadHealthInfo()]);
  } catch (error: any) {
    message.error(
      `初始化失敗: ${error.response?.data?.error || error.message}`
    );
  } finally {
    isLoading.value = false;
  }
};

const generateStaffToken = async () => {
  if (!props.device) return;

  if (!props.device.ismartid || props.device.ismartid.trim() === "") {
    message.error("設備缺少有效的ISmartID");
    throw new Error("Missing ismartid");
  }

  try {
    console.log("Generating token for device:", {
      device_id: props.device.id,
      device_name: props.device.name,
      ismartid: props.device.ismartid,
      is_staff: true,
    });

    // @ts-ignore
    const response = await AuthApi.publicToken({
      ismartid: props.device.ismartid,
      is_staff: true,
    }, null);

    console.log("Token response:", response.data);

    // 檢查響應數據結構
    if (!response.data || !response.data.data || !response.data.data.token) {
      message.error("Token生成失敗：返回數據格式錯誤");
      throw new Error("Invalid token response");
    }

    staffToken.value = response.data.data.token;
    message.success("Token生成成功");
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    message.error(`生成Token失敗: ${errorMsg}`);
    console.error("Generate token error:", error);
    console.error("Request data:", {
      ismartid: props.device.ismartid,
      is_staff: true,
    });
    console.error("Error response:", error.response?.data);
    throw error;
  }
};

const loadDeviceInfo = async () => {
  if (!props.device || !staffToken.value) {
    console.log("Cannot load device info: missing device or token");
    return;
  }

  try {
    const response = await OrangePiRemoteApi.getInfo(
      props.device.id,
      staffToken.value
    );
    deviceInfo.value = response.data.data;
  } catch (error: any) {
    message.error(
      `獲取設備信息失敗: ${error.response?.data?.error || error.message}`
    );
  }
};

const loadHealthInfo = async () => {
  if (!props.device) return;

  try {
    const response = await OrangePiRemoteApi.getHealth(props.device.id);
    healthInfo.value = response.data.data;
  } catch (error: any) {
    message.error(
      `獲取健康檢查失敗: ${error.response?.data?.error || error.message}`
    );
  }
};

const loadPathsList = async (page = 0) => {
  if (!props.device || !staffToken.value) {
    message.warning("請先生成Token");
    return;
  }

  // 防止重複加載
  if (isLoadingPaths.value) {
    return;
  }

  isLoadingPaths.value = true;
  try {
    const response = await OrangePiRemoteApi.listPaths({
      id: props.device.id,
      token: staffToken.value,
      page,
      items_per_page: pageSize.value,
    });
    pathsList.value = response.data.data.items || [];
    pathsTotal.value = response.data.data.itemsTotal || 0;
    currentPage.value = page;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    message.error(`獲取Paths列表失敗: ${errorMsg}`);
    console.error("Load paths error:", error);
  } finally {
    isLoadingPaths.value = false;
  }
};

const handleTabChange = async (key: string) => {
  activeTab.value = key;
  if (key === "paths" && staffToken.value) {
    // 只在首次切換或數據為空時加載
    if (pathsList.value.length === 0) {
      await loadPathsList();
    }
  }
};

const showAddPathDialog = () => {
  pathDialogMode.value = "add";
  selectedPathName.value = "";
  pathFormData.value = {
    name: "",
    source: "",
    sourceOnDemand: false,
    record: false,
    recordPath: "./recordings/%path/%Y-%m-%d_%H-%M-%S",
    recordPartDuration: "30m",
  };
  isPathDialogVisible.value = true;
};

const showEditPathDialog = async (pathName: string) => {
  if (!props.device || !staffToken.value) {
    message.warning("請先生成Token");
    return;
  }

  isLoading.value = true;
  try {
    const response = await OrangePiRemoteApi.getPathDetail({
      id: props.device.id,
      token: staffToken.value,
      name: pathName,
    });

    console.log("Path detail response:", response.data);

    const detail = response.data.data;

    // 檢查返回數據是否有效
    if (!detail) {
      message.error("獲取Path詳情失敗：返回數據為空");
      console.error("Invalid detail data:", detail);
      return;
    }

    // 如果 conf 為 null，使用默認值
    const conf = detail.conf || {};

    pathDialogMode.value = "edit";
    selectedPathName.value = pathName;
    pathFormData.value = {
      name: detail.name || pathName,
      source: conf.source || "",
      sourceOnDemand: conf.sourceOnDemand ?? false,
      record: conf.record ?? false,
      recordPath: conf.recordPath || "./recordings/%path/%Y-%m-%d_%H-%M-%S",
      recordPartDuration: conf.recordPartDuration || "30m",
    };

    isPathDialogVisible.value = true;

    // 如果 source 為空，提示用戶
    if (!conf.source) {
      message.warning(`Path "${pathName}" 尚未配置RTSP地址，請添加`);
    }
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    message.error(`獲取Path詳情失敗: ${errorMsg}`);
    console.error("Edit path error:", error);
    console.error("Error response:", error.response);
  } finally {
    isLoading.value = false;
  }
};

const handlePathSubmit = async () => {
  if (!props.device || !staffToken.value) return;

  // 驗證表單數據
  if (!pathFormData.value.name || !pathFormData.value.name.trim()) {
    message.error("Path名稱不能為空");
    return;
  }

  if (!pathFormData.value.source || !pathFormData.value.source.trim()) {
    message.error("拉流地址不能為空");
    return;
  }

  isLoading.value = true;
  try {
    if (pathDialogMode.value === "add") {
      // 檢查是否已存在同名 path
      const existingPath = pathsList.value.find(
        (p) => p.name === pathFormData.value.name.trim()
      );
      if (existingPath) {
        message.error(
          `Path "${pathFormData.value.name}" 已存在，請使用其他名稱`
        );
        isLoading.value = false;
        return;
      }

      await OrangePiRemoteApi.addPath({
        id: props.device.id,
        token: staffToken.value,
        name: pathFormData.value.name.trim(),
        config: {
          source: pathFormData.value.source.trim(),
          sourceOnDemand: false,
          record: false,
        },
      });
      message.success("新增Path成功");
    } else {
      await OrangePiRemoteApi.updatePath({
        id: props.device.id,
        token: staffToken.value,
        name: selectedPathName.value,
        config: {
          source: pathFormData.value.source.trim(),
          sourceOnDemand: false,
          record: false,
        },
      });
      message.success("更新Path成功");
    }
    isPathDialogVisible.value = false;
    // 刷新列表
    await loadPathsList(currentPage.value);
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    if (errorMsg.includes("already exists")) {
      message.error(`Path "${pathFormData.value.name}" 已存在`);
    } else if (errorMsg.includes("not found")) {
      message.error(`Path "${selectedPathName.value}" 不存在`);
    } else {
      message.error(`操作失敗: ${errorMsg}`);
    }
  } finally {
    isLoading.value = false;
  }
};

const handleDeletePath = (pathName: string) => {
  Modal.confirm({
    title: `確定要刪除 ${pathName} 嗎？`,
    content: "此操作不可恢復",
    onOk: async () => {
      if (!props.device || !staffToken.value) return;

      isLoading.value = true;
      try {
        await OrangePiRemoteApi.deletePath({
          id: props.device.id,
          token: staffToken.value,
          name: pathName,
        });
        message.success("刪除成功");
        await loadPathsList(currentPage.value);
      } catch (error: any) {
        message.error(
          `刪除失敗: ${error.response?.data?.error || error.message}`
        );
      } finally {
        isLoading.value = false;
      }
    },
  });
};

// 加載所有NVR列表
const loadAllNvrs = async () => {
  isLoadingNvrs.value = true;
  try {
    const response = await NvrApi.list();
    const data = response.data.data;
    if (Array.isArray(data)) {
      allNvrs.value = data;
    } else if ("items" in data) {
      allNvrs.value = data.items;
    } else {
      allNvrs.value = data ? [data] : [];
    }
  } catch (error: any) {
    message.error(
      `加載NVR列表失敗: ${error.response?.data?.error || error.message}`
    );
    allNvrs.value = [];
  } finally {
    isLoadingNvrs.value = false;
  }
};

// 顯示同步NVR對話框
const showSyncNvrDialog = async () => {
  if (!staffToken.value) {
    message.warning("請先生成Token");
    return;
  }
  selectedNvrId.value = null;
  await loadAllNvrs();
  isSyncNvrDialogVisible.value = true;
};

// 格式化NVR顯示
const formatNvr = (nvr: Nvr) => {
  return `ID: ${nvr.id} | ${nvr.name} | ${nvr.url} | RTSP通道數: ${
    nvr.rtsp_urls?.length || 0
  }`;
};

// 處理NVR選擇
const handleNvrSelect = (nvrId: number) => {
  selectedNvrId.value = selectedNvrId.value === nvrId ? null : nvrId;
};

// 從path名稱中提取通道號（例如：channel1 -> 1）
const extractChannelFromPathName = (pathName: string): number | null => {
  const match = pathName.match(/^channel(\d+)$/i);
  return match && match[1] ? parseInt(match[1], 10) : null;
};

// 執行同步NVR
const handleSyncNvr = async () => {
  if (!props.device || !staffToken.value) {
    message.error("設備信息或Token缺失");
    return;
  }

  if (!selectedNvrId.value) {
    message.warning("請選擇一個NVR");
    return;
  }

  const selectedNvr = allNvrs.value.find((n) => n.id === selectedNvrId.value);
  if (!selectedNvr) {
    message.error("選擇的NVR不存在");
    return;
  }

  if (!selectedNvr.rtsp_urls || selectedNvr.rtsp_urls.length === 0) {
    message.warning(`NVR "${selectedNvr.name}" 沒有配置RTSP URLs`);
    return;
  }

  // 確保paths列表已加載
  if (pathsList.value.length === 0) {
    await loadPathsList(0);
  }

  Modal.confirm({
    title: `確定要同步NVR "${selectedNvr.name}" 嗎？`,
    content: `此操作將對比NVR的${selectedNvr.rtsp_urls.length}個RTSP通道，更新匹配的Path URL，新增缺失的Path，保留現有的其他Path。`,
    okText: "確定同步",
    okType: "primary",
    onOk: async () => {
      isSyncing.value = true;
      try {
        // 創建通道號到現有Path的映射
        const existingPathsMap = new Map<number, MediaMTXPath>();
        pathsList.value.forEach((path) => {
          const channel = extractChannelFromPathName(path.name);
          if (channel !== null) {
            existingPathsMap.set(channel, path);
          }
        });

        // 創建NVR RTSP URLs的通道號映射
        const nvrChannelsMap = new Map<
          number,
          { channel: number; url: string }
        >();
        selectedNvr.rtsp_urls.forEach((rtspUrl) => {
          nvrChannelsMap.set(rtspUrl.channel, rtspUrl);
        });

        const updatePromises: Promise<any>[] = [];
        const addPromises: Promise<any>[] = [];
        let updateCount = 0;
        let addCount = 0;

        // 處理每個NVR的RTSP URL
        selectedNvr.rtsp_urls.forEach((rtspUrl) => {
          const existingPath = existingPathsMap.get(rtspUrl.channel);
          const pathName = `channel${rtspUrl.channel}`;

          if (existingPath) {
            // 如果Path已存在，更新URL
            updatePromises.push(
              OrangePiRemoteApi.updatePath({
                id: props.device!.id,
                token: staffToken.value,
                name: pathName,
                config: {
                  source: rtspUrl.url,
                  sourceOnDemand: false,
                  record: false,
                },
              })
                .then(() => {
                  updateCount++;
                })
                .catch((error) => {
                  console.error(`更新Path "${pathName}" 失敗:`, error);
                  throw error;
                })
            );
          } else {
            // 如果Path不存在，新增
            addPromises.push(
              OrangePiRemoteApi.addPath({
                id: props.device!.id,
                token: staffToken.value,
                name: pathName,
                config: {
                  source: rtspUrl.url,
                  sourceOnDemand: false,
                  record: false,
                },
              })
                .then(() => {
                  addCount++;
                })
                .catch((error) => {
                  console.error(`添加Path "${pathName}" 失敗:`, error);
                  throw error;
                })
            );
          }
        });

        // 執行所有更新和新增操作
        await Promise.all([...updatePromises, ...addPromises]);

        const summary = [];
        if (updateCount > 0) summary.push(`更新${updateCount}個`);
        if (addCount > 0) summary.push(`新增${addCount}個`);

        message.success(
          `同步成功！${summary.join("，")}RTSP通道${
            summary.length > 0 ? "。" : ""
          }`
        );
        isSyncNvrDialogVisible.value = false;
        // 刷新列表
        await loadPathsList(0);
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || error.message;
        message.error(`同步失敗: ${errorMsg}`);
        console.error("Sync NVR error:", error);
      } finally {
        isSyncing.value = false;
      }
    },
  });
};

const handleClose = () => {
  emit("update:visible", false);
};

// 複製RTSP地址到剪貼板
const copyRtspUrl = async (url: string) => {
  if (!url) {
    message.warning("RTSP地址為空");
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    message.success("RTSP地址已複製到剪貼板");
  } catch (error) {
    // 降級方案：使用傳統方法
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      message.success("RTSP地址已複製到剪貼板");
    } catch (err) {
      message.error("複製失敗，請手動複製");
    }
    document.body.removeChild(textArea);
  }
};
</script>

<template>
  <a-modal
    :open="visible"
    :title="dialogTitle"
    width="900px"
    :footer="null"
    @cancel="handleClose"
  >
    <a-spin :spinning="isLoading">
      <a-tabs
        v-model:activeKey="activeTab"
        @change="handleTabChange"
      >
        <template #tabBarExtraContent>
          <div
            v-if="activeTab === 'paths'"
            class="flex gap-2 items-center"
          >
            <a-button
              @click="loadPathsList(currentPage)"
              :loading="isLoadingPaths"
            >
              刷新列表
            </a-button>
            <a-tooltip :title="!staffToken ? '請先切換到其他標籤頁生成Token' : ''">
              <a-button
                type="default"
                @click="showSyncNvrDialog"
                :disabled="!staffToken"
              >
                同步NVR
              </a-button>
            </a-tooltip>
            <a-button
              type="primary"
              @click="showAddPathDialog"
            >
              新增Path
            </a-button>
          </div>
        </template>
        <!-- 設備信息 -->
        <a-tab-pane
          key="info"
          tab="設備信息"
        >
          <a-descriptions
            v-if="deviceInfo"
            bordered
            :column="2"
            size="small"
          >
            <a-descriptions-item label="設備ID">
              {{ deviceInfo.device_id }}
            </a-descriptions-item>
            <a-descriptions-item label="MediaMTX版本">
              {{ deviceInfo.mediamtx_version }}
            </a-descriptions-item>
            <a-descriptions-item label="FRP服務器">
              {{ deviceInfo.frpc_server }}
            </a-descriptions-item>
            <a-descriptions-item label="認證端口">
              {{ deviceInfo.frpc_auth_remote_port }}
            </a-descriptions-item>
            <a-descriptions-item label="SSH端口">
              {{ deviceInfo.frpc_ssh_remote_port }}
            </a-descriptions-item>
            <a-descriptions-item label="Auth代理名稱">
              <a-typography-text
                code
                v-if="deviceInfo.frpc_auth_proxy_name"
              >
                {{ deviceInfo.frpc_auth_proxy_name }}
              </a-typography-text>
              <span
                v-else
                class="text-gray-400"
              >未配置</span>
            </a-descriptions-item>
            <a-descriptions-item label="SSH代理名稱">
              <a-typography-text
                code
                v-if="deviceInfo.frpc_ssh_proxy_name"
              >
                {{ deviceInfo.frpc_ssh_proxy_name }}
              </a-typography-text>
              <span
                v-else
                class="text-gray-400"
              >未配置</span>
            </a-descriptions-item>
            <a-descriptions-item label="狀態">
              <a-tag :color="deviceInfo.status === 'online' ? 'green' : 'red'">
                {{ deviceInfo.status }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item
              label="可用頻道"
              :span="2"
            >
              {{ deviceInfo.available_channels?.join(', ') || '無' }}
            </a-descriptions-item>
          </a-descriptions>
          <a-empty
            v-else
            description="暫無設備信息"
          />
        </a-tab-pane>

        <!-- 健康檢查 -->
        <a-tab-pane
          key="health"
          tab="健康檢查"
        >
          <a-descriptions
            v-if="healthInfo"
            bordered
            :column="1"
            size="small"
          >
            <a-descriptions-item label="狀態">
              <a-tag :color="healthInfo.status === 'healthy' ? 'green' : 'red'">
                {{ healthInfo.status }}
              </a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="服務名">
              {{ healthInfo.service }}
            </a-descriptions-item>
            <a-descriptions-item
              v-if="healthInfo.docker_services"
              label="Docker服務"
            >
              <div class="space-y-1">
                <div
                  v-for="(status, service) in healthInfo.docker_services"
                  :key="service"
                  class="flex items-center gap-2"
                >
                  <a-tag
                    :color="status ? 'green' : 'red'"
                    size="small"
                  >
                    {{ status ? '運行中' : '已停止' }}
                  </a-tag>
                  <span>{{ service }}</span>
                </div>
              </div>
            </a-descriptions-item>
          </a-descriptions>
          <a-empty
            v-else
            description="暫無健康檢查信息"
          />
        </a-tab-pane>

        <!-- MediaMTX Paths -->
        <a-tab-pane
          key="paths"
          tab="MediaMTX Paths"
        >
          <a-table
            :columns="columns"
            :data-source="pathsList"
            :loading="isLoadingPaths"
            :pagination="{
               current: currentPage + 1,
               pageSize: pageSize,
               total: pathsTotal,
               showSizeChanger: false,
               onChange: (page: number) => loadPathsList(page - 1),
             }"
            row-key="name"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'source'">
                <div
                  v-if="record.source"
                  class="flex items-center gap-2"
                >
                  <a-tooltip :title="record.source">
                    <span
                      class="text-xs text-gray-600 flex-1 truncate">{{ record.source }}</span>
                  </a-tooltip>
                  <a-button
                    type="text"
                    size="small"
                    @click="copyRtspUrl(record.source)"
                    class="shrink-0"
                    title="複製RTSP地址"
                  >
                    <template #icon>
                      <CopyOutlined />
                    </template>
                  </a-button>
                </div>
                <span
                  v-else
                  class="text-xs text-gray-400"
                >未配置</span>
              </template>
              <template v-else-if="column.key === 'ready'">
                <a-tag :color="record.ready ? 'green' : 'red'">
                  {{ record.ready ? '就緒' : '未就緒' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <span>
                  <a @click="showEditPathDialog(record.name)">編輯</a>
                  <a-divider type="vertical" />
                  <a
                    style="color: lightcoral"
                    @click="handleDeletePath(record.name)"
                  >
                    刪除
                  </a>
                </span>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-spin>

    <!-- 同步NVR對話框 -->
    <a-modal
      v-model:open="isSyncNvrDialogVisible"
      title="同步NVR"
      width="700px"
    >
      <a-spin :spinning="isLoadingNvrs">
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="nvr in allNvrs"
            :key="nvr.id"
            class="p-3 border rounded-lg cursor-pointer transition-all hover:border-blue-400"
            :class="{
              'bg-gray-100 border-blue-500': selectedNvrId === nvr.id,
              'bg-white': selectedNvrId !== nvr.id,
            }"
            @click="handleNvrSelect(nvr.id)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm">
                {{ formatNvr(nvr) }}
              </span>
              <a-tag
                v-if="selectedNvrId === nvr.id"
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
            v-if="allNvrs.length === 0 && !isLoadingNvrs"
            description="暫無可用NVR"
          />
        </div>
      </a-spin>

      <template #footer>
        <div class="flex justify-between items-center">
          <span class="text-sm text-gray-500">
            {{ selectedNvrId ? `已選擇 NVR ID: ${selectedNvrId}` : '請選擇一個NVR' }}
          </span>
          <div class="space-x-2">
            <a-button @click="isSyncNvrDialogVisible = false">
              取消
            </a-button>
            <a-button
              type="primary"
              danger
              :loading="isSyncing"
              :disabled="!selectedNvrId"
              @click="handleSyncNvr"
            >
              確定同步
            </a-button>
          </div>
        </div>
      </template>
    </a-modal>

    <!-- Path 新增/編輯對話框 -->
    <a-modal
      v-model:open="isPathDialogVisible"
      :title="pathDialogMode === 'add' ? '新增Path' : `編輯Path - ${selectedPathName}`"
      width="600px"
      @ok="handlePathSubmit"
      @cancel="isPathDialogVisible = false"
    >
      <a-form
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="Path名稱">
          <a-input
            v-model:value="pathFormData.name"
            :disabled="pathDialogMode === 'edit'"
            placeholder="例如: channel1"
          />
          <div
            v-if="pathDialogMode === 'edit'"
            class="text-xs text-gray-500 mt-1"
          >
            編輯模式下不可修改Path名稱
          </div>
        </a-form-item>

        <a-form-item label="RTSP地址">
          <a-textarea
            v-model:value="pathFormData.source"
            :placeholder="pathDialogMode === 'edit' && pathFormData.source ? '在此修改RTSP地址' : 'rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0'"
            :rows="3"
            :auto-size="{ minRows: 2, maxRows: 5 }"
          />
          <div class="text-xs text-gray-500 mt-1">
            完整的RTSP拉流地址，包含用戶名密碼和參數
          </div>
        </a-form-item>

        <a-alert
          message="配置說明"
          description="按需拉流和錄像功能已關閉，僅實時拉流轉發"
          type="info"
          show-icon
          class="mt-2"
        />
      </a-form>
    </a-modal>
  </a-modal>
</template>

<style scoped>
.space-y-1 > * + * {
  margin-top: 0.25rem;
}

/* 确保按钮与标签栏对齐 */
:deep(.ant-tabs-extra-content) {
  display: flex;
  align-items: center;
}
</style>

