<!-- frontend/src/views/Login.vue -->
<template>
  <div class="login-container">
    <h2>User Login</h2>
    <form @submit.prevent="login">
      <div>
        <label for="username">Username:</label>
        <input type="text" id="username" v-model="username" required/>
      </div>
      <div>
        <label for="password">Password:</label>
        <input type="password" id="password" v-model="password" required/>
      </div>
      <button type="submit">Login</button>
    </form>
    <p>
      Don't have an account?
      <router-link to="/register">Register here</router-link>
    </p>
  </div>
</template>

<script lang="ts">
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import axios from 'axios';
import {useStore} from 'vuex';

export default {
  name: 'Login',
  setup() {
    const username = ref('');
    const password = ref('');
    const router = useRouter();
    const store = useStore();

    const login = async () => {
      if (username.value && password.value) {
        try {
          const response = await axios.post('/api/auth/login', {
            username: username.value,
            password: password.value
          });
          console.log('Login response:', response.data);
          const {token, role} = response.data.data;
          // 调整角色值格式（如必要）
          const normalizedRole = role.trim().toLowerCase();
          console.log('Normalized role:', normalizedRole);
          // 在登录成功后保存到 Vuex 及 localStorage
          store.commit('setCurrentUser', {username: username.value, role: normalizedRole, token});
          localStorage.setItem('currentUser', JSON.stringify({username: username.value, role: normalizedRole, token}));
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
          console.error('Login failed:', error.response?.data || error);
          alert('Login failed: ' + (error.response?.data?.error || error.message || 'Unknown error'));
        }
      }
    };
    return {username, password, login};
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