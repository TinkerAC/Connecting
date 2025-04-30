<!-- frontend/src/views/teacher/TeacherDashboard.vue -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">教师主页 · 发布新作业</h2>

      <form @submit.prevent="publishAssignment" class="max-w-xl space-y-6">
        <div>
          <label for="title" class="block text-sm mb-1">作业标题</label>
          <input id="title" v-model="assignment.title" required
                 class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <div>
          <label for="desc" class="block text-sm mb-1">作业描述</label>
          <textarea id="desc" v-model="assignment.description" required rows="4"
                    class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        </div>
        <button type="submit"
                class="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow active:scale-95">
          发布作业
        </button>
      </form>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import axios from 'axios';
import { useStore } from 'vuex';
import Panel from '@/components/Layout/Panel.vue';

const store = useStore();
const assignment = ref({ title: '', description: '' });

const publishAssignment = async () => {
  try {
    await axios.post('/api/assignments', { ...assignment.value, teacherId: store.state.currentUser.id }, {
      headers: { Authorization: `Bearer ${store.state.currentUser?.token}` }
    });
    assignment.value = { title: '', description: '' };
    alert('作业已发布');
  } catch { alert('发布失败'); }
};
</script>
