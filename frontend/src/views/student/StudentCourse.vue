<!-- ========= 1A. frontend/src/views/student/StudentCourse.vue ========= -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">我的课程</h2>

      <!-- 加入课程 -->
      <div class="mb-8 p-4 bg-white dark:bg-gray-800 rounded-xl shadow flex flex-col sm:flex-row items-center gap-4">
        <label for="joinCourseId" class="text-sm shrink-0">课程 ID：</label>
        <input id="joinCourseId" v-model.number="joinCourseId" type="number" placeholder="输入课程 ID"
               class="w-full sm:w-40 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <button @click="joinCourse"
                class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white shrink-0">加入课程</button>
      </div>

      <!-- 已加入课程列表 -->
      <ul v-if="courses.length" class="space-y-4">
        <li v-for="c in courses" :key="c.id"
            class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow flex flex-col gap-2">
          <h3 class="font-medium">{{ c.title }}</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">{{ c.description }}</p>
          <button @click="goToCourse(c.id)"
                  class="self-start text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white">查看详情</button>
        </li>
      </ul>
      <p v-else class="text-gray-500">尚未加入任何课程，请输入课程 ID 加入。</p>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from '@/components/Layout/Panel.vue';

const courses = ref<any[]>([]);
const joinCourseId = ref<number | null>(null);
const router = useRouter();
const store = useStore();

const auth = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadCourses = async () => {
  try {
    const { data } = await axios.get('/api/enrollments', auth());
    courses.value = data.data.enrollments.map((e: any) => e.course);
  } catch { alert('加载课程失败'); }
};

const joinCourse = async () => {
  if (!joinCourseId.value) return alert('请输入课程 ID');
  try {
    await axios.post('/api/enrollments', { courseId: joinCourseId.value }, auth());
    joinCourseId.value = null;
    await loadCourses();
    alert('加入成功');
  } catch (e: any) {
    alert('加入失败：' + (e.response?.data?.error || '未知错误'));
  }
};

const goToCourse = (id: number) => router.push(`/student/course/${id}`);

onMounted(loadCourses);
</script>
