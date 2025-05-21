<template>
  <aside
      class="w-56 lg:w-64 shrink-0 bg-white/90 dark:bg-gray-800/90 border-r border-gray-200 dark:border-gray-700 backdrop-blur overflow-y-auto">
    <nav class="p-4 space-y-1">
      <router-link v-for="item in filteredMenu" :key="item.path" :to="item.path"
                   class="block px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-50 dark:hover:bg-indigo-600/30 hover:text-indigo-600 dark:hover:text-white"
                   :class="isActive(item.path) && 'bg-indigo-500/20 text-indigo-600 dark:bg-indigo-600 dark:text-white'">
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<script lang="ts" setup>
import {computed} from 'vue';
import {useStore} from 'vuex';
import {useRoute} from 'vue-router';

interface MenuItem {
  label: string;
  path: string;
  roles: string[];
}

const menuItems: MenuItem[] = [
  {label: '教师主页', path: '/teacher', roles: ['teacher']},
  {label: '我教的课', path: '/teacher/courses', roles: ['teacher']},
  {label: '学生主页', path: '/student', roles: ['student']},
  {label: '我的课程', path: '/student/courses', roles: ['student']},
  {label: '管理员面板', path: '/admin', roles: ['admin']},
  {label: '课程管理', path: '/admin/courseManagement', roles: ['admin']}
];

const store = useStore();
const route = useRoute();
const filteredMenu = computed(() => {
  const user = store.state.currentUser;
  return user ? menuItems.filter(m => m.roles.includes(user.role)) : [];
});
const isActive = (path: string) => route.path.startsWith(path);
</script>