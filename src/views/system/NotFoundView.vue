<template>
  <div
    class="flex min-h-[60vh] flex-col items-center justify-center text-center"
  >
    <p class="text-6xl font-bold text-muted">404</p>
    <p class="mt-4 text-xl text-foreground">頁面不存在</p>
    <p class="text-sm text-muted">Page Not Found</p>
    <RouterLink
      to="/dashboard"
      class="mt-6 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted/40"
    >
      返回儀表盤
    </RouterLink>
  </div>
</template>

