<template>
  <header class="h-14 flex items-center justify-between px-6 lg:px-8 bg-white/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 backdrop-blur">
    <h1 class="text-lg font-semibold tracking-wide text-indigo-600 dark:text-indigo-400">Connecting</h1>

    <div class="flex items-center gap-6 text-sm">
      <span class="text-gray-500 dark:text-gray-400 hidden md:inline-flex">{{ timeStr }}</span>

      <template v-if="currentUser">
        <span class="text-gray-700 dark:text-gray-300">欢迎，{{ currentUser.name || currentUser.username }} ({{ currentUser.role }})</span>
        <button @click="logout" class="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs">退出</button>
      </template>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();
const currentUser = computed(() => store.state.currentUser);

const timeStr = ref('');
let timer: number;  // window.setInterval returns number
const updateTime = () => {
  const now = new Date();
  timeStr.value = now.toLocaleString();
};

onMounted(() => {
  updateTime();
  timer = window.setInterval(updateTime, 1000);
});

onBeforeUnmount(() => clearInterval(timer));

const logout = () => {
  store.commit('logout');
  localStorage.removeItem('currentUser');
  router.push('/login');
};
</script>