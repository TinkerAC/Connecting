<template>
  <div class="flex flex-col h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 select-none">
    <TopBar />

    <div class="flex flex-1 overflow-hidden">
      <SideMenu />
      <!-- Main scrollable area -->
      <div class="flex-1 overflow-y-auto p-6 lg:p-8 bg-gray-50 dark:bg-gray-900/40">
        <slot name="content" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import TopBar from './TopBar.vue';
import SideMenu from './SideMenu.vue';
</script>