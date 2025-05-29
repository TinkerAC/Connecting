<!-- frontend/src/views/teacher/TeacherCourseDetail.vue -->
<template>
  <Panel>
    <template #content>
      <!-- 课程信息 -->
      <section v-if="course" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-8">
        <h2 class="text-2xl font-semibold mb-2">{{ course.title }}</h2>
        <p class="text-gray-600 dark:text-gray-300 mb-4">{{ course.description }}</p>
        <p class="text-sm text-gray-500">教师 ID：{{ course.teacherId }}</p>
      </section>
      <p v-else class="text-gray-500">正在加载课程信息…</p>

      <!-- 作业列表 -->
      <section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium">作业列表</h3>
          <button @click="toggleNewForm"
                  class="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-700 text-white">
            {{ showNewForm ? '取消' : '发布新作业' }}
          </button>
        </div>

        <ul v-if="assignments.length" class="space-y-4">
          <li v-for="a in assignments" :key="a.id"
              class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex flex-col gap-2 shadow">
            <div class="flex items-center justify-between">
              <span class="font-medium">{{ a.title }}</span>
              <button @click="viewAnalysis(a.id)"
                      class="text-xs px-2 py-1 rounded bg-green-600 hover:bg-green-700 text-white">查看分析</button>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">{{ a.description }}</p>
            <span class="text-xs text-gray-500">提交数：{{ a.submissionCount || 0 }}</span>
          </li>
        </ul>
        <p v-else class="text-gray-500">暂无作业</p>

        <!-- 发布新作业表单 -->
        <form v-if="showNewForm" @submit.prevent="publishAssignment"
              class="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-600 pt-6">
          <div>
            <label for="newTitle" class="block text-sm mb-1">标题</label>
            <input id="newTitle" v-model="newAssignment.title" required
                   class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div>
            <label for="newDesc" class="block text-sm mb-1">描述</label>
            <textarea id="newDesc" v-model="newAssignment.description" required rows="3"
                      class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
          </div>
          <div class="flex gap-3">
            <button type="submit"
                    class="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white">发布</button>
            <button type="button" @click="toggleNewForm"
                    class="px-4 py-2 rounded bg-gray-400 hover:bg-gray-500 text-white">取消</button>
          </div>
        </form>
      </section>

      <!-- 学生名单 -->
      <section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
        <h3 class="text-lg font-medium mb-4">已选学生</h3>
        <div v-if="students.length" class="overflow-x-auto">
          <div class="overflow-x-auto">
            <table class="min-w-full table-fixed text-sm">
              <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
              <tr>
                <th class="w-1/6 px-3 py-2 text-left">ID</th>
                <th class="w-2/6 px-3 py-2 text-left">姓名</th>
                <th class="w-3/6 px-3 py-2 text-left">邮箱</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                  v-for="s in students"
                  :key="s.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/30"
              >
                <td class="px-3 py-2 text-left">{{ s.id }}</td>
                <td class="px-3 py-2 text-left">{{ s.name }}</td>
                <td class="px-3 py-2 text-left">{{ s.email || '-' }}</td>
              </tr>
              </tbody>
            </table>
          </div>

        </div>
        <p v-else class="text-gray-500">暂无学生</p>
      </section>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from '@fsrc/components/Layout/Panel.vue';

const route = useRoute();
const router = useRouter();
const store = useStore();
const courseId = Number(route.params.id);

const course = ref<any>(null);
const assignments = ref<any[]>([]);
const students = ref<any[]>([]);
const showNewForm = ref(false);
const newAssignment = ref({ title: '', description: '' });

const getAuth = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadCourseDetails = async () => {
  try { course.value = (await axios.get(`/api/courses/${courseId}`, getAuth())).data.data.course; }
  catch { alert('无法加载课程信息'); }
};
const loadAssignments = async () => {
  try { assignments.value = (await axios.get(`/api/courses/${courseId}/assignments`, getAuth())).data.data.assignments || []; }
  catch { alert('无法加载作业列表'); }
};
const loadStudents = async () => {
  try { students.value = (await axios.get(`/api/courses/${courseId}/students`, getAuth())).data.data.students || []; }
  catch { alert('无法加载学生列表'); }
};

const publishAssignment = async () => {
  try {
    await axios.post('/api/assignments', { courseId, ...newAssignment.value }, getAuth());
    await loadAssignments();
    newAssignment.value = { title: '', description: '' };
    showNewForm.value = false;
    alert('发布成功');
  } catch { alert('发布失败'); }
};

const toggleNewForm = () => (showNewForm.value = !showNewForm.value);
const viewAnalysis = (aid: number) => router.push(`/teacher/course/${courseId}/assignment/${aid}`);

onMounted(() => { loadCourseDetails(); loadAssignments(); loadStudents(); });
</script>
