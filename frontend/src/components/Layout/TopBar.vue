<!-- frontend/src/components/Layout/TopBar.vue -->
<template>
  <div class="topbar">
    <h1>全栈网站</h1>
    <div v-if="currentUser" class="user-info">
      <span>欢迎, {{ currentUser.username }} ({{ currentUser.role }})</span>
      <button @click="logout">退出登录</button>
    </div>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'TopBar',
  setup() {
    const store = useStore();
    const router = useRouter();
    // 从 store 中获取当前用户
    const currentUser = computed(() => store.state.currentUser);

    const logout = () => {
      // 清除 Vuex 中用户状态
      store.commit('logout');
      // 清除 localStorage 中保存的登录信息
      localStorage.removeItem('currentUser');
      // 跳转到登录页
      router.push('/login');
    };

    return { currentUser, logout };
  }
};
</script>

<style scoped>
.topbar {
  background-color: #f0f0f0;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.user-info {
  display: flex;
  align-items: center;
}

.user-info span {
  margin-right: 10px;
}
</style>