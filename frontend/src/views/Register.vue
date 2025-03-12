<!-- frontend/src/views/Register.vue -->
<template>
  <div class="register-container">
    <h2>用户注册</h2>
    <form @submit.prevent="register">
      <div>
        <label for="username">用户名：</label>
        <input type="text" id="username" v-model="username" required />
      </div>
      <div>
        <label for="password">密码：</label>
        <input type="password" id="password" v-model="password" required />
      </div>
      <div>
        <label for="confirmPassword">确认密码：</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" required />
      </div>
      <div>
        <label for="role">角色：</label>
        <select id="role" v-model="role">
          <option value="teacher">教师</option>
          <option value="student">学生</option>
          <option value="admin">管理员</option>
        </select>
      </div>
      <button type="submit">注册</button>
    </form>
    <p>已有账号？<router-link to="/login">去登录</router-link></p>
  </div>
</template>

<script lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'Register',
  setup() {
    const username = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const role = ref('学生'); // 默认选择学生
    const router = useRouter();

    const register = async () => {
      if (password.value !== confirmPassword.value) {
        alert('两次输入的密码不一致');
        return;
      }
      try {
        const response = await axios.post('/api/auth/register', {
          username: username.value,
          password: password.value,
          role: role.value
        });
        console.log('注册成功：', response.data);
        alert('注册成功，请登录');
        await router.push('/login');
      } catch (error: any) {
        console.error('注册失败：', error.response?.data || error);
        alert('注册失败: ' + (error.response?.data?.error || '未知错误'));
      }
    };

    return { username, password, confirmPassword, role, register };
  }
};
</script>

<style scoped>
.register-container {
  max-width: 400px;
  margin: 50px auto;
  padding: 20px;
  border: 1px solid #ccc;
}
</style>