<!-- frontend/src/views/Login.vue -->
<template>
  <div class="login-container">
    <h2>用户登录</h2>
    <form @submit.prevent="login">
      <div>
        <label for="email">邮箱:</label>
        <input type="email" id="email" v-model="email" required/>
      </div>
      <div>
        <label for="password">密码:</label>
        <input type="password" id="password" v-model="password" required/>
      </div>
      <button type="submit">登录</button>
    </form>
    <p>
      没有账号？
      <router-link to="/register">去注册</router-link>
    </p>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'Login',
  setup() {
    const email = ref('');
    const password = ref('');
    const router = useRouter();
    const store = useStore();

    const login = async () => {
      if (email.value && password.value) {
        try {
          const response = await axios.post('/api/auth/login', {
            email: email.value,
            password: password.value
          });
          console.log('登录响应:', response.data);
          const { token, role, name } = response.data.data;
          // 调整角色值格式（如必要）
          const normalizedRole = role.trim().toLowerCase();
          console.log('Normalized role:', normalizedRole);
          // 在登录成功后保存到 Vuex 及 localStorage
          store.commit('setCurrentUser', { email: email.value, name, role: normalizedRole, token });
          localStorage.setItem('currentUser', JSON.stringify({ email: email.value, name, role: normalizedRole, token }));
          // 根据角色进行路由跳转
          if (normalizedRole === 'teacher') {
            await router.push('/teacher');
          } else if (normalizedRole === 'student') {
            await router.push('/student');
          } else if (normalizedRole === 'admin') {
            await router.push('/admin');
          } else {
            await router.push('/');
          }
        } catch (error: any) {
          console.error('登录失败:', error.response?.data || error);
          alert('登录失败: ' + (error.response?.data?.error || error.message || '未知错误'));
        }
      }
    };
    return { email, password, login };
  }
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
}
</style>