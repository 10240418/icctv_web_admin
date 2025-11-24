<script setup lang="ts">
import { ref } from "vue";

interface OrangePiRow {
  id: number;
  name: string;
  base: string;
  sshRemotePort: number;
  isActive: boolean;
}

const columns = [
  { title: "名稱", titleEn: "Name", dataIndex: "name", key: "name" },
  { title: "所屬園區", titleEn: "Base", dataIndex: "base", key: "base" },
  {
    title: "SSH 遠程端口",
    titleEn: "SSH Remote Port",
    dataIndex: "sshRemotePort",
    key: "sshRemotePort",
  },
  {
    title: "狀態",
    titleEn: "Status",
    dataIndex: "isActive",
    key: "isActive",
    customRender: ({ value }: { value: boolean }) => (value ? "啟用" : "停用"),
  },
];

const data = ref<OrangePiRow[]>([
  { id: 1, name: "OP-01", base: "HQ-1", sshRemotePort: 6001, isActive: true },
  { id: 2, name: "OP-02", base: "HQ-2", sshRemotePort: 6002, isActive: false },
]);
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <a-input-search
        placeholder="搜尋設備名稱"
        class="w-64"
      />
      <a-button type="primary">創建設備</a-button>
      <a-button>批量導入</a-button>
    </div>
    <a-table
      :columns="columns"
      :data-source="data"
      row-key="id"
    />
  </div>
</template>

