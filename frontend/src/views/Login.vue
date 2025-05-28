// file: frontend/src/views/Login.vue
<template>
  <div class="relative min-h-screen bg-gray-900 flex items-center justify-center overflow-hidden">
    <div
        class="absolute -top-1/2 -left-1/4 w-[60rem] h-[60rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full filter blur-3xl opacity-30 animate-blob-slow"></div>
    <div
        class="absolute -bottom-1/2 -right-1/4 w-[50rem] h-[50rem] bg-gradient-to-br from-emerald-400 via-cyan-400 to-sky-500 rounded-full filter blur-3xl opacity-20 animate-blob-slow animation-delay-5000"></div>
    <div class="w-full max-w-md px-8 py-10 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 z-10">
      <h1 class="text-3xl font-bold text-center text-white mb-8 select-none">Connecting 登录</h1>

      <form @submit.prevent="login" class="space-y-6">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-200 mb-1">邮箱</label>
          <input
              type="email"
              id="email"
              v-model="email"
              required
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-200 mb-1">密码</label>
          <input
              type="password"
              id="password"
              v-model="password"
              required
              class="w-full px-4 py-2 rounded-lg bg-white/20 text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

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
// Script 内容保持不变
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
/* 定义新的动画名称或修改现有的 (如果希望) */
@keyframes blob-slow-animation { /* 从 'blob' 重命名以避免冲突或用于区分 */
  0%, 100% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(20px, -30px) scale(1.05); /* 减小位移, 轻微减小缩放 */
  }
  66% {
    transform: translate(-15px, 15px) scale(0.95); /* 减小位移, 轻微减小缩放 */
  }
}

.animate-blob-slow { /* 新的类名用于更慢的动画 */
  animation: blob-slow-animation 30s infinite ease-in-out; /* 增加动画时长至30秒 (原为18秒) */
}

/* 保留原始的 animation-delay-4000 类, 因为它足够通用 */
/* .animation-delay-4000 应用于原始的第二个色块。新的延时是5000，用于修改后的色块 */
.animation-delay-4000 {
  animation-delay: 4s;
}
.animation-delay-5000 { /* 为新的延时创建特定类名, 或者如果愿意, 可以使用内联样式 */
  animation-delay: 5s;
}


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

</style>