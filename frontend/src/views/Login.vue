<template>
  <div class="relative min-h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
    <div
        class="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
    <div
        class="absolute -bottom-32 -right-20 w-80 h-80 bg-gradient-to-br from-emerald-400 via-cyan-400 to-sky-500 rounded-full filter blur-2xl opacity-30 animate-blob animation-delay-4000"></div>

    <!-- Card -->
    <div class="w-full max-w-md px-8 py-10 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20">
      <h1 class="text-3xl font-bold text-center text-white mb-8 select-none">Connecting 登录</h1>

      <form @submit.prevent="login" class="space-y-6">
        <!-- Email -->
        <div>
          <label for="email" class="block text-sm font-medium text-gray-200 mb-1">邮箱</label>
          <input
              type="email"
              id="email"
              v-model="email"
              required
              placeholder="you@example.com"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <!-- Password -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-200 mb-1">密码</label>
          <input
              type="password"
              id="password"
              v-model="password"
              required
              placeholder="******"
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <!-- Submit -->
        <button
            type="submit"
            class="w-full py-2 font-semibold rounded-lg bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition text-white shadow-lg shadow-indigo-500/30"
        >
          登录
        </button>
      </form>

      <p class="text-center text-sm text-gray-300 mt-6">
        没有账号？
        <router-link to="/register" class="font-medium text-indigo-300 hover:text-indigo-200">去注册</router-link>
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {ref} from 'vue';
import {useRouter} from 'vue-router';
import axios from 'axios';
import {useStore} from 'vuex';

const email = ref('');
const password = ref('');
const router = useRouter();
const store = useStore();

const login = async () => {
  if (email.value && password.value) {
    try {
      const response = await axios.post('/api/auth/login', {
        email: email.value,
        password: password.value,
      });
      const {token, role, name} = response.data.data;
      const normalizedRole = role.trim().toLowerCase();
      store.commit('setCurrentUser', {email: email.value, name, role: normalizedRole, token});
      localStorage.setItem(
          'currentUser',
          JSON.stringify({email: email.value, name, role: normalizedRole, token}),
      );
      if (normalizedRole === 'teacher') await router.push('/teacher');
      else if (normalizedRole === 'student') await router.push('/student');
      else if (normalizedRole === 'admin') await router.push('/admin');
      else await router.push('/');
    } catch (error: any) {
      alert('登录失败: ' + (error.response?.data?.error || error.message || '未知错误'));
    }
  }
};
</script>

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 18s infinite ease-in-out;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
