<!-- frontend/src/views/StudentDashboard.vue -->
<template>
  <Panel>
    <template #content>
      <h2>学生主页 - 查看及提交作业</h2>
      <div>
        <h3>当前作业列表</h3>
        <ul>
          <li v-for="assignment in assignments" :key="assignment.id">
            <span>{{ assignment.title }}</span>
            <button @click="selectAssignment(assignment)">提交作业</button>
          </li>
        </ul>
      </div>
      <div v-if="selectedAssignment">
        <h3>提交作业: {{ selectedAssignment.title }}</h3>
        <form @submit.prevent="submitAssignment">
          <div>
            <input type="file" @change="handleFileUpload" accept=".doc,.docx" required/>
          </div>
          <button type="submit">提交</button>
        </form>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts">
import {onMounted, ref} from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import axios from 'axios';
import {useStore} from 'vuex';

export default {
  name: 'StudentDashboard',
  components: {Panel},
  setup() {
    const store = useStore();
    const assignments = ref([]);
    const selectedAssignment = ref<any>(null);
    const file = ref<File | null>(null);

    // 辅助函数：构造带有 token 的请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return {
        headers: {Authorization: `Bearer ${token}`}
      };
    };


    const selectAssignment = (assignment: any) => {
      selectedAssignment.value = assignment;
    };

    const handleFileUpload = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        file.value = target.files[0];
      }
    };

    const submitAssignment = async () => {
      if (!file.value || !selectedAssignment.value) {
        alert('请先选择作业和上传文件');
        return;
      }
      try {
        const formData = new FormData();
        formData.append('file', file.value);
        formData.append('assignmentId', selectedAssignment.value.id);
        // 假设后端实现了文件上传接口，并需要认证 token
        const response = await axios.post('/api/assignments/submit', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...getAuthConfig().headers
          }
        });
        console.log('提交作业成功:', response.data);
        alert('作业提交成功');
        selectedAssignment.value = null;
        file.value = null;
      } catch (error) {
        console.error('提交作业错误:', error);
        alert('作业提交失败');
      }
    };

    onMounted(() => {
      // loadAssignments();
    });

    return {assignments, selectedAssignment, selectAssignment, handleFileUpload, submitAssignment};
  }
};
</script>

<style scoped>
/* 根据需要添加样式 */
</style>