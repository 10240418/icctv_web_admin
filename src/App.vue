<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import { appRoutes } from "./router/routes";
import {
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ApiOutlined,
  SettingOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons-vue";

const route = useRoute();
const showLayout = computed(() => route.meta?.layout !== false);

const iconMap = {
  dashboard: DashboardOutlined,
  team: TeamOutlined,
  app: AppstoreOutlined,
  home: HomeOutlined,
  api: ApiOutlined,
  setting: SettingOutlined,
  "video-camera": VideoCameraOutlined,
};

const navigationRoutes = computed(() =>
  appRoutes.filter(
    (r) => !r.redirect && r.meta?.layout !== false && r.path !== "/"
  )
);
</script>

<template>
  <RouterView v-if="!showLayout" />
  <div
    v-else
    class="flex min-h-screen bg-surface text-foreground transition-colors duration-300"
  >
    <aside
      class="hidden w-68 flex-col border-r border-border bg-surface px-5 py-6 md:flex"
    >
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm uppercase tracking-[0.3em] text-muted">Icctv</p>
          <p class="text-xl font-semibold">後台管理</p>
          <p class="text-xs text-muted">Backend Management</p>
        </div>
      </div>
      <nav class="mt-10 flex flex-1 flex-col gap-2">
        <RouterLink
          v-for="nav in navigationRoutes"
          :key="nav.path"
          :to="nav.path"
          class="group flex flex-col gap-1 rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200"
          :class="
            route.path.startsWith(nav.path)
              ? 'bg-[#EAEBEF] text-foreground'
              : 'text-[#717182] hover:bg-[#F0F0F0]'
          "
        >
          <div class="flex items-center gap-3">
            <component
              :is="iconMap[nav.meta?.icon as keyof typeof iconMap]"
              class="text-lg text-accent group-hover:text-accent"
            />
            <span>{{ nav.meta?.title }}</span>
          </div>
          <p
            v-if="nav.meta?.subtitle"
            class="text-xs text-muted/70 pl-7"
          >
            {{ nav.meta.subtitle }}
          </p>
        </RouterLink>
      </nav>
    </aside>
    <main class="flex flex-1 flex-col">
      <section class="flex-1 bg-surface p-6">
        <RouterView />
      </section>
    </main>
  </div>
</template>
