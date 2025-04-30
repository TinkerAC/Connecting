
<template>
  <div class="relative min-h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
    <!-- Animated gradient background circles -->
    <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[50rem] h-[50rem] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-500 rounded-full filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

    <!-- Card -->
    <div class="w-full max-w-lg px-10 py-12 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
      <h1 class="text-3xl font-bold text-center text-white mb-8 select-none">Connecting 注册</h1>

      <form @submit.prevent="register" class="space-y-6">
        <!-- Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-gray-200 mb-1">姓名</label>
          <input
              type="text"
              id="name"
              v-model="name"
              required
              placeholder="张三"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-200 mb-1">邮箱</label>
          <input
              type="email"
              id="email"
              v-model="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <!-- Password -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="password" class="block text-sm font-medium text-gray-200 mb-1">密码</label>
            <input
                type="password"
                id="password"
                v-model="password"
                required
                placeholder="******"
                class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-gray-200 mb-1">确认密码</label>
            <input
                type="password"
                id="confirmPassword"
                v-model="confirmPassword"
                required
                placeholder="******"
                class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
          </div>
        </div>

        <!-- Role -->
        <div>
          <label for="role" class="block text-sm font-medium text-gray-200 mb-1">角色</label>
          <select
              id="role"
              v-model="role"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-pink-400"
          >
            <option value="teacher">教师</option>
            <option value="student">学生</option>
            <option value="admin">管理员</option>
          </select>
        </div>

        <!-- Submit -->
        <button
            type="submit"
            class="w-full py-2 font-semibold rounded-lg bg-pink-500 hover:bg-pink-600 active:scale-95 transition text-white shadow-lg shadow-pink-500/30"
        >
          注册
        </button>
      </form>

      <p class="text-center text-sm text-gray-300 mt-6">
        已有账号？
        <router-link to="/login" class="font-medium text-pink-300 hover:text-pink-200">去登录</router-link>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const role = ref('student');
const router = useRouter();

const register = async () => {
  if (password.value !== confirmPassword.value) {
    alert('两次输入的密码不一致');
    return;
  }
  try {
    await axios.post('/api/auth/register', {
      name: name.value,
      email: email.value,
      password: password.value,
      role: role.value,
    });
    alert('注册成功，请登录');
    await router.push('/login');
  } catch (error: any) {
    alert('注册失败: ' + (error.response?.data?.error || '未知错误'));
  }
};
</script>

<style scoped>
@keyframes blob {
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  33%      { transform: translate(40px, -30px) scale(1.1); }
  66%      { transform: translate(-30px, 20px) scale(0.9); }
}
.animate-blob {
  animation: blob 22s infinite ease-in-out;
}
.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
