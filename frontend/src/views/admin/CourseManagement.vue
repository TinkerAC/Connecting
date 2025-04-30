<!-- ========= 1B. frontend/src/views/admin/CourseManagement.vue ========= -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">课程管理</h2>

      <!-- 新建课程 -->
      <form @submit.prevent="createCourse"
            class="max-w-xl space-y-6 bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-8">
        <div>
          <label for="title" class="block text-sm mb-1">课程标题</label>
          <input id="title" v-model="title" required
                 class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label for="description" class="block text-sm mb-1">课程描述</label>
          <textarea id="description" v-model="description" required rows="3"
                    class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label for="teacherId" class="block text-sm mb-1">绑定教师 ID</label>
          <input id="teacherId" type="number" v-model.number="teacherId" required
                 class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit"
                class="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow active:scale-95">
          新增课程
        </button>
      </form>

      <!-- 课程列表 -->
      <section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
        <h3 class="text-lg font-medium mb-4">所有课程</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            <tr>
              <th class="px-3 py-2">ID</th>
              <th class="px-3 py-2">标题</th>
              <th class="px-3 py-2">描述</th>
              <th class="px-3 py-2">教师 ID</th>
              <th class="px-3 py-2">操作</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="c in courses" :key="c.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-3 py-2">{{ c.id }}</td>
              <td class="px-3 py-2">{{ c.title }}</td>
              <td class="px-3 py-2">{{ c.description }}</td>
              <td class="px-3 py-2">{{ c.teacherId }}</td>
              <td class="px-3 py-2 space-x-2">
                <button @click="editCourse(c)"
                        class="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">编辑</button>
                <button @click="deleteCourse(c.id)"
                        class="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">删除</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!courses.length" class="text-gray-500 text-sm mt-4">暂无课程</p>
      </section>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from '@/components/Layout/Panel.vue';

const store = useStore();
const title = ref('');
const description = ref('');
const teacherId = ref<number | null>(null);
const courses = ref<any[]>([]);

const auth = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadCourses = async () => {
  try {
    const { data } = await axios.get('/api/courses', auth());
    courses.value = data.data?.courses ?? data.data ?? [];
  } catch { alert('加载课程失败'); }
};

const createCourse = async () => {
  if (!title.value || !description.value || teacherId.value === null) return alert('请完整填写');
  try {
    await axios.post('/api/courses', { title: title.value, description: description.value, teacherId: teacherId.value }, auth());
    title.value = ''; description.value = ''; teacherId.value = null;
    await loadCourses(); alert('创建成功');
  } catch { alert('创建失败'); }
};

const editCourse = (c: any) => alert(`准备编辑：${c.title}`);
const deleteCourse = async (id: number) => {
  if (!confirm('确定删除该课程？')) return;
  try { await axios.delete(`/api/courses/${id}`, auth()); await loadCourses(); }
  catch { alert('删除失败'); }
};

onMounted(loadCourses);
</script>
