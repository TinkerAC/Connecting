<!-- frontend/src/components/Layout/SideMenu.vue -->
<template>
  <div class="sidemenu">
    <ul>
      <li v-for="item in filteredMenu" :key="item.path">
        <router-link :to="item.path">{{ item.label }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {computed} from 'vue';
import {useStore} from 'vuex';

interface MenuItem {
  label: string;
  path: string;
  roles: string[];
}

// 原有的菜单项基础上扩展“我的课程”
const menuItems: MenuItem[] = [
  {label: '教师主页', path: '/teacher', roles: ['teacher']},
  {label: '我教的课', path: '/teacher/courses', roles: ['teacher']},
  {label: '学生主页', path: '/student', roles: ['student']},
  {label: '我的课程', path: '/student/courses', roles: ['student']},
  {label: '管理员面板', path: '/admin', roles: ['admin']},
  {label: '课程管理', path: '/admin/courseManagement', roles: ['admin']}
];

export default {
  name: 'SideMenu',
  setup() {
    const store = useStore();
    const filteredMenu = computed(() => {
      const currentUser = store.state.currentUser;
      if (!currentUser) return [];
      return menuItems.filter(item => item.roles.includes(currentUser.role));
    });
    return {filteredMenu};
  }
};
</script>

<style scoped>
.sidemenu {
  width: 200px;
  background-color: #e0e0e0;
  padding: 10px;
}

.sidemenu ul {
  list-style: none;
  padding: 0;
}

.sidemenu li {
  margin-bottom: 10px;
}
</style>