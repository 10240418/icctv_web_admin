<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { message, Modal } from "ant-design-vue";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons-vue";
import type { Nvr } from "@/model/nvr";
import { NvrApi } from "@/httpapis/api";

interface Props {
  visible: boolean;
  nvr?: Nvr;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  "update:visible": [value: boolean];
  refreshList: [];
}>();

const activeTab = ref("admin");
const isLoading = ref(false);

// 管理員賬戶
const adminForm = ref({ name: "", password: "" });

// 普通用戶列表
const usersList = ref<Array<{ name: string; password: string }>>([]);
const isUserDialogVisible = ref(false);
const userDialogMode = ref<"add" | "edit">("add");
const selectedUserIndex = ref(-1);
const userForm = ref({ name: "", password: "" });
const passwordVisible = ref<Record<string, boolean>>({}); // 控制每個用戶密碼的顯示狀態

// RTSP URLs 列表
const rtspUrlsList = ref<Array<{ channel: number; url: string }>>([]);
const isRtspDialogVisible = ref(false);
const rtspDialogMode = ref<"add" | "edit">("add");
const selectedRtspIndex = ref(-1);
const rtspForm = ref({ channel: 0, url: "" });

const usersColumns = [
  { title: "用戶名", dataIndex: "name", key: "name", width: 150 },
  { title: "密碼", dataIndex: "password", key: "password", width: 150 },
  { title: "操作", key: "action", width: 120 },
];

const rtspColumns = [
  { title: "通道號", dataIndex: "channel", key: "channel", width: 100 },
  { title: "RTSP地址", dataIndex: "url", key: "url", ellipsis: true },
  { title: "操作", key: "action", width: 120 },
];

const dialogTitle = computed(() => {
  return props.nvr ? `${props.nvr.name} - 詳細管理` : "NVR 詳情";
});

watch(
  () => props.visible,
  (newVal) => {
    if (newVal && props.nvr) {
      loadNvrData();
    } else {
      resetData();
    }
  }
);

const resetData = () => {
  activeTab.value = "admin";
  adminForm.value = { name: "", password: "" };
  usersList.value = [];
  rtspUrlsList.value = [];
};

const loadNvrData = () => {
  if (!props.nvr) return;

  adminForm.value = props.nvr.admin_user
    ? { ...props.nvr.admin_user }
    : { name: "", password: "" };
  usersList.value = props.nvr.users ? [...props.nvr.users] : [];
  rtspUrlsList.value = props.nvr.rtsp_urls ? [...props.nvr.rtsp_urls] : [];
};

// ========== 管理員賬戶管理 ==========
const handleUpdateAdmin = async () => {
  if (!props.nvr) return;

  if (!adminForm.value.name || !adminForm.value.password) {
    message.error("用戶名和密碼不能為空");
    return;
  }

  isLoading.value = true;
  try {
    await NvrApi.updateAdminUser({
      id: props.nvr.id,
      admin_user: adminForm.value,
    });
    message.success("管理員賬戶更新成功");
    emit("refreshList");
  } catch (error: any) {
    message.error(`更新失敗: ${error.response?.data?.error || error.message}`);
  } finally {
    isLoading.value = false;
  }
};

// ========== 普通用戶管理 ==========
const showAddUserDialog = () => {
  userDialogMode.value = "add";
  selectedUserIndex.value = -1;
  userForm.value = { name: "", password: "" };
  isUserDialogVisible.value = true;
};

const showEditUserDialog = (index: number) => {
  userDialogMode.value = "edit";
  selectedUserIndex.value = index;
  const user = usersList.value[index];
  if (user) {
    userForm.value = { ...user };
  } else {
    userForm.value = { name: "", password: "" };
  }
  isUserDialogVisible.value = true;
};

const handleUserSubmit = async () => {
  if (!props.nvr) return;

  if (!userForm.value.name || !userForm.value.password) {
    message.error("用戶名和密碼不能為空");
    return;
  }

  isLoading.value = true;
  try {
    if (userDialogMode.value === "add") {
      // 檢查用戶名是否重複
      if (usersList.value.some((u) => u.name === userForm.value.name)) {
        message.error("用戶名已存在");
        isLoading.value = false;
        return;
      }

      await NvrApi.addUser({
        id: props.nvr.id,
        user: userForm.value,
      });
      message.success("添加用戶成功");
    } else {
      // 編輯模式
      const oldUser = usersList.value[selectedUserIndex.value];
      if (!oldUser) {
        message.error("用戶不存在");
        isLoading.value = false;
        return;
      }
      const oldUsername = oldUser.name;
      const newUsername = userForm.value.name;

      // 如果用戶名改變了，需要先刪除舊用戶，再添加新用戶
      if (oldUsername !== newUsername) {
        // 檢查新用戶名是否已存在
        if (usersList.value.some((u) => u.name === newUsername)) {
          message.error("新用戶名已存在");
          isLoading.value = false;
          return;
        }

        // 先刪除舊用戶
        await NvrApi.removeUser({
          id: props.nvr.id,
          username: oldUsername,
        });

        // 再添加新用戶
        await NvrApi.addUser({
          id: props.nvr.id,
          user: userForm.value,
        });

        message.success("更新用戶成功（用戶名已更改）");
      } else {
        // 用戶名沒變，只更新密碼：更新整個用戶列表
        const newUsers = [...usersList.value];
        newUsers[selectedUserIndex.value] = userForm.value;
        await NvrApi.updateUsers({
          id: props.nvr.id,
          users: newUsers,
        });
        message.success("更新用戶成功");
      }
    }

    isUserDialogVisible.value = false;
    await refreshNvrData();
  } catch (error: any) {
    message.error(`操作失敗: ${error.response?.data?.error || error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const handleDeleteUser = (username: string) => {
  Modal.confirm({
    title: `確定要刪除用戶 ${username} 嗎？`,
    onOk: async () => {
      if (!props.nvr) return;

      isLoading.value = true;
      try {
        await NvrApi.removeUser({
          id: props.nvr.id,
          username,
        });
        message.success("刪除用戶成功");
        await refreshNvrData();
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

// ========== RTSP URL 管理 ==========
const showAddRtspDialog = () => {
  rtspDialogMode.value = "add";
  selectedRtspIndex.value = -1;
  rtspForm.value = { channel: 0, url: "" };
  isRtspDialogVisible.value = true;
};

const showEditRtspDialog = (index: number) => {
  rtspDialogMode.value = "edit";
  selectedRtspIndex.value = index;
  const rtspUrl = rtspUrlsList.value[index];
  if (rtspUrl) {
    rtspForm.value = { ...rtspUrl };
  } else {
    rtspForm.value = { channel: 0, url: "" };
  }
  isRtspDialogVisible.value = true;
};

const handleRtspSubmit = async () => {
  if (!props.nvr) return;

  if (!rtspForm.value.channel || !rtspForm.value.url) {
    message.error("通道號和RTSP地址不能為空");
    return;
  }

  isLoading.value = true;
  try {
    if (rtspDialogMode.value === "add") {
      // 檢查通道是否重複
      if (
        rtspUrlsList.value.some((r) => r.channel === rtspForm.value.channel)
      ) {
        message.error("通道號已存在");
        isLoading.value = false;
        return;
      }

      await NvrApi.addRTSPUrl({
        id: props.nvr.id,
        url: rtspForm.value,
      });
      message.success("添加RTSP地址成功");
    } else {
      // 編輯模式：更新整個列表
      const newUrls = [...rtspUrlsList.value];
      newUrls[selectedRtspIndex.value] = rtspForm.value;
      await NvrApi.update({ rtsp_urls: newUrls }, props.nvr.id);
      message.success("更新RTSP地址成功");
    }

    isRtspDialogVisible.value = false;
    await refreshNvrData();
  } catch (error: any) {
    message.error(`操作失敗: ${error.response?.data?.error || error.message}`);
  } finally {
    isLoading.value = false;
  }
};

const handleDeleteRtsp = (channel: number) => {
  Modal.confirm({
    title: `確定要刪除通道 ${channel} 嗎？`,
    onOk: async () => {
      if (!props.nvr) return;

      isLoading.value = true;
      try {
        await NvrApi.removeRTSPUrl({
          id: props.nvr.id,
          channel,
        });
        message.success("刪除RTSP地址成功");
        await refreshNvrData();
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

const refreshNvrData = async () => {
  if (!props.nvr) return;

  try {
    const response = await NvrApi.list({ id: props.nvr.id });
    const data = response.data.data;
    const nvr = Array.isArray(data) ? data[0] : data;

    if (nvr) {
      adminForm.value = nvr.admin_user
        ? { ...nvr.admin_user }
        : { name: "", password: "" };
      usersList.value = nvr.users ? [...nvr.users] : [];
      rtspUrlsList.value = nvr.rtsp_urls ? [...nvr.rtsp_urls] : [];
    }

    emit("refreshList");
  } catch (error: any) {
    message.error(
      `刷新數據失敗: ${error.response?.data?.error || error.message}`
    );
  }
};

const handleClose = () => {
  emit("update:visible", false);
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
      <a-tabs v-model:activeKey="activeTab">
        <template #tabBarExtraContent>
          <div
            v-if="activeTab === 'admin'"
            class="flex gap-2"
          >
            <a-button
              type="primary"
              @click="handleUpdateAdmin"
            >
              更新管理員賬戶
            </a-button>
          </div>
          <div
            v-else-if="activeTab === 'users'"
            class="flex gap-2"
          >
            <a-button
              type="primary"
              @click="showAddUserDialog"
            >
              添加用戶
            </a-button>
          </div>
          <div
            v-else-if="activeTab === 'rtsp'"
            class="flex gap-2"
          >
            <a-button
              type="primary"
              @click="showAddRtspDialog"
            >
              添加RTSP地址
            </a-button>
          </div>
        </template>
        <!-- 管理員賬戶 -->
        <a-tab-pane
          key="admin"
          tab="管理員賬戶"
        >
          <a-form
            :label-col="{ span: 24 }"
            :wrapper-col="{ span: 24 }"
            layout="vertical"
          >
            <a-form-item label="用戶名">
              <a-input v-model:value="adminForm.name" />
            </a-form-item>
            <a-form-item label="密碼">
              <a-input-password v-model:value="adminForm.password" />
            </a-form-item>
          </a-form>
        </a-tab-pane>

        <!-- 普通用戶管理 -->
        <a-tab-pane
          key="users"
          tab="普通用戶"
        >
          <a-table
            :columns="usersColumns"
            :data-source="usersList"
            :pagination="false"
            row-key="name"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'password'">
                <div class="flex items-center gap-2">
                  <span v-if="passwordVisible[record.name]">
                    {{ record.password }}
                  </span>
                  <span v-else>
                    ••••••••
                  </span>
                  <a-button
                    type="text"
                    size="small"
                    @click="passwordVisible[record.name] = !passwordVisible[record.name]"
                  >
                    <EyeOutlined v-if="!passwordVisible[record.name]" />
                    <EyeInvisibleOutlined v-else />
                  </a-button>
                </div>
              </template>
              <template v-else-if="column.key === 'action'">
                <span>
                  <a @click="showEditUserDialog(index)">編輯</a>
                  <a-divider type="vertical" />
                  <a
                    style="color: lightcoral"
                    @click="handleDeleteUser(record.name)"
                  >
                    刪除
                  </a>
                </span>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <!-- RTSP URLs 管理 -->
        <a-tab-pane
          key="rtsp"
          tab="RTSP地址"
        >
          <a-table
            :columns="rtspColumns"
            :data-source="rtspUrlsList"
            :pagination="false"
            row-key="channel"
            size="small"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'url'">
                <a-tooltip :title="record.url">
                  <span class="text-xs text-gray-600">{{ record.url }}</span>
                </a-tooltip>
              </template>
              <template v-else-if="column.key === 'action'">
                <span>
                  <a @click="showEditRtspDialog(index)">編輯</a>
                  <a-divider type="vertical" />
                  <a
                    style="color: lightcoral"
                    @click="handleDeleteRtsp(record.channel)"
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

    <!-- 用戶新增/編輯對話框 -->
    <a-modal
      v-model:open="isUserDialogVisible"
      :title="userDialogMode === 'add' ? '添加用戶' : '編輯用戶'"
      @ok="handleUserSubmit"
      @cancel="isUserDialogVisible = false"
    >
      <a-form
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="用戶名">
          <a-input
            v-model:value="userForm.name"
            placeholder="輸入用戶名"
          />
          <div
            v-if="userDialogMode === 'edit'"
            class="text-xs text-gray-500 mt-1"
          >
            修改用戶名後，系統會刪除舊用戶並創建新用戶
          </div>
        </a-form-item>
        <a-form-item label="密碼">
          <a-input-password
            v-model:value="userForm.password"
            placeholder="輸入密碼"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- RTSP URL 新增/編輯對話框 -->
    <a-modal
      v-model:open="isRtspDialogVisible"
      :title="rtspDialogMode === 'add' ? '添加RTSP地址' : '編輯RTSP地址'"
      width="700px"
      @ok="handleRtspSubmit"
      @cancel="isRtspDialogVisible = false"
    >
      <a-form
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 18 }"
      >
        <a-form-item label="通道號">
          <a-input-number
            v-model:value="rtspForm.channel"
            :disabled="rtspDialogMode === 'edit'"
            :min="1"
            :max="999"
            style="width: 100%"
            placeholder="輸入通道號"
          />
          <div
            v-if="rtspDialogMode === 'edit'"
            class="text-xs text-gray-500 mt-1"
          >
            編輯模式下不可修改通道號
          </div>
        </a-form-item>
        <a-form-item label="RTSP地址">
          <a-textarea
            v-model:value="rtspForm.url"
            placeholder="rtsp://admin:password@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0"
            :rows="3"
            :auto-size="{ minRows: 2, maxRows: 5 }"
          />
          <div class="text-xs text-gray-500 mt-1">
            完整的RTSP地址，包含用戶名密碼和參數
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </a-modal>
</template>

<style scoped>
.space-y-1 > * + * {
  margin-top: 0.25rem;
}
</style>

