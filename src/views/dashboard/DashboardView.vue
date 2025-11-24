<script setup lang="ts">
const cards = [
  {
    title: "在線設備",
    titleEn: "Online Devices",
    value: 24,
    trend: "+3",
    subtitle: "近 24 小時",
    subtitleEn: "Last 24 hours",
  },
  {
    title: "管理員帳戶",
    titleEn: "Admin Accounts",
    value: 6,
    trend: "+1",
    subtitle: "總數",
    subtitleEn: "Total",
  },
  {
    title: "公網 IP",
    titleEn: "Public IP",
    value: 3,
    trend: "0",
    subtitle: "當前可用",
    subtitleEn: "Available",
  },
];
</script>

<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-3">
      <a-card
        v-for="card in cards"
        :key="card.title"
        class="bg-surface/90"
      >
        <template #title>
          <div>
            <p class="font-medium">{{ card.title }}</p>
            <p class="text-xs text-muted">{{ card.titleEn }}</p>
          </div>
        </template>
        <div class="flex items-end justify-between">
          <p class="text-3xl font-semibold text-foreground">{{ card.value }}</p>
          <span class="text-sm text-muted">{{ card.trend }}</span>
        </div>
        <div class="mt-2">
          <p class="text-sm text-muted">{{ card.subtitle }}</p>
          <p class="text-xs text-muted/70">{{ card.subtitleEn }}</p>
        </div>
      </a-card>
    </div>

    <a-card class="bg-surface/90">
      <template #title>
        <div>
          <p class="font-medium">設備運行概覽</p>
          <p class="text-xs text-muted">Device Operation Overview</p>
        </div>
      </template>
      <p class="text-muted">
        這裡將接入 ECharts 組件展示 OrangePi 在線率、端口使用情況以及建築分佈，便於快速掌握系統狀態。
      </p>
    </a-card>
  </div>
</template>

