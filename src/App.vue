<script setup lang="ts">
import { onMounted, ref, watch, computed } from "vue";
import { useRoute } from "vue-router";
import { appRoutes } from "./router/routes";
import {
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  HomeOutlined,
  ApiOutlined,
  SettingOutlined,
} from "@ant-design/icons-vue";

const isDark = ref(window.matchMedia("(prefers-color-scheme: dark)").matches);
const applyTheme = (dark: boolean) => {
  const root = document.documentElement;
  if (dark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
};

onMounted(() => {
  applyTheme(isDark.value);
});

watch(isDark, (value) => applyTheme(value));

const route = useRoute();
const showLayout = computed(() => route.meta?.layout !== false);

const iconMap = {
  dashboard: DashboardOutlined,
  team: TeamOutlined,
  app: AppstoreOutlined,
  home: HomeOutlined,
  api: ApiOutlined,
  setting: SettingOutlined,
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
        <button
          class="rounded-full border border-border px-3 py-1 text-sm text-muted hover:bg-muted/40"
          @click="isDark = !isDark"
        >
          {{ isDark ? '☀' : '🌙' }}
        </button>
      </div>
      <nav class="mt-10 flex flex-1 flex-col gap-2">
        <RouterLink
          v-for="nav in navigationRoutes"
          :key="nav.path"
          :to="nav.path"
          class="group flex flex-col gap-1 rounded-xl px-4 py-3 text-base font-medium transition duration-200"
          :class="
            route.path.startsWith(nav.path)
              ? 'bg-accent/15 text-foreground shadow-sm ring-1 ring-accent/30'
              : 'text-muted hover:bg-muted/60 hover:text-foreground'
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
