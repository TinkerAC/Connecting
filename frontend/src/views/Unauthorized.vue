<!-- ========= 2. frontend/src/views/Unauthorized.vue ========= -->
<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-200">
    <h1 class="text-3xl font-bold mb-4">无权限访问</h1>
    <p class="mb-6">您无权查看此页面。</p>
    <router-link to="/login"
                 class="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow">返回登录</router-link>
  </div>
</template>

<script lang="ts" setup>
</script>
