<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">我的课程</h2>

      <div v-if="courses.length"
           class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <router-link v-for="c in courses" :key="c.id"
                     :to="`/teacher/course/${c.id}`"
                     class="block p-6 bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition">
          <h3 class="text-lg font-medium mb-2">{{ c.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{{ c.description }}</p>
        </router-link>
      </div>

      <p v-else class="text-gray-500">暂无课程</p>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from "@/components/Layout/Panel.vue";

const store   = useStore();
const courses = ref<any[]>([]);

const authCfg = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadCourses = async () => {
  try {
    const teacherId = store.state.currentUser.id;
    const { data }  = await axios.get('/api/courses', { params: { teacherId }, ...authCfg() });
    courses.value   = data.data?.courses || data.data || [];
  } catch (err) {
    alert('课程加载失败');
  }
};

onMounted(loadCourses);
</script>
