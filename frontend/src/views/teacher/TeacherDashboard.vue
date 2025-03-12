<!-- frontend/src/views/TeacherDashboard.vue -->
<template>
  <Panel>
    <template #content>
      <h2>教师主页 - 发布新作业</h2>
      <form @submit.prevent="publishAssignment">
        <div>
          <label for="title">作业标题：</label>
          <input type="text" id="title" v-model="assignment.title" required />
        </div>
        <div>
          <label for="description">作业描述：</label>
          <textarea id="description" v-model="assignment.description" required></textarea>
        </div>
        <button type="submit">发布作业</button>
      </form>
    </template>
  </Panel>
</template>

<script lang="ts">
import { ref } from 'vue';

import axios from 'axios';
import Panel from "@/components/Layout/Panel.vue";

export default {
  name: 'TeacherDashboard',
  components: { Panel },
  setup() {
    const assignment = ref({
      title: '',
      description: ''
    });

    const publishAssignment = async () => {
      try {
        // 此处假设当前教师ID为 1，实际应从登录状态中获取
        const response = await axios.post('/api/assignments', {
          title: assignment.value.title,
          description: assignment.value.description,
          teacherId: 1
        });
        console.log('发布成功:', response.data);
        alert('作业已发布');
        assignment.value.title = '';
        assignment.value.description = '';
      } catch (error) {
        console.error('发布作业错误:', error);
        alert('发布作业失败');
      }
    };

    return { assignment, publishAssignment };
  }
};
</script>