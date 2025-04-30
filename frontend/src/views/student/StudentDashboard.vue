<!-- ========= 2. frontend/src/views/student/StudentDashboard.vue ========= -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">学生主页 · 当前作业</h2>

      <ul class="space-y-4">
        <li v-for="a in assignments" :key="a.id"
            class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow flex justify-between items-center">
          <span>{{ a.title }}</span>
          <button @click="selectAssignment(a)"
                  class="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">提交作业
          </button>
        </li>
      </ul>

      <!-- 提交区 -->
      <div v-if="selectedAssignment" class="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow space-y-4">
        <h3 class="text-lg font-medium">提交：{{ selectedAssignment.title }}</h3>
        <input type="file" accept=".doc,.docx" @change="handleFileUpload"
               class="w-full text-sm text-gray-500 file:mr-4 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-gray-200 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-100"/>
        <button @click="submitAssignment"
                class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white">确认提交
        </button>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import {onMounted, ref} from 'vue';
import {useStore} from 'vuex';
import axios from 'axios';
import Panel from '@/components/Layout/Panel.vue';

const store = useStore();
const assignments = ref<any[]>([]);
const selectedAssignment = ref<any>(null);
const file = ref<File | null>(null);

const auth = () => ({headers: {Authorization: `Bearer ${store.state.currentUser?.token}`}});

const loadAssignments = async () => {
  try {
    const {data} = await axios.get('/api/assignments/current', auth()); // 假设有该接口
    assignments.value = data.data || [];
  } catch { /* 忽略 */
  }
};

const selectAssignment = (a: any) => {
  selectedAssignment.value = a;
};
const handleFileUpload = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) file.value = files[0];
};
const submitAssignment = async () => {
  if (!file.value || !selectedAssignment.value) return alert('请选择作业和文件');
  const fd = new FormData();
  fd.append('file', file.value);
  fd.append('assignmentId', selectedAssignment.value.id);
  try {
    await axios.post('/api/assignments/submit', fd, {
      headers: {...auth().headers, 'Content-Type': 'multipart/form-data'}
    });
    alert('提交成功');
    file.value = null;
    selectedAssignment.value = null;
  } catch {
    alert('提交失败');
  }
};

onMounted(loadAssignments);
</script>
