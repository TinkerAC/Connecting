<!-- frontend/src/views/StudentCourseDetail.vue -->
<template>
  <Panel>
    <template #content>
      <h2>Course Details (Student)</h2>
      <h3>Assignments</h3>
      <div v-if="assignments.length">
        <ul>
          <li v-for="assignment in assignments" :key="assignment.id">
            <div>
              <strong>{{ assignment.title }}</strong>
              <p>{{ assignment.description }}</p>
              <p>
                Status:
                <span v-if="assignment.submitted">Submitted</span>
                <span v-else>Not Submitted</span>
              </p>
              <button
                  v-if="!assignment.submitted"
                  @click="submitAssignment(assignment.id)"
              >
                Submit Assignment
              </button>
            </div>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>No assignments found.</p>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts">
import { onMounted, ref } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'StudentCourseDetail',
  components: { Panel },
  setup() {
    const route = useRoute();
    const store = useStore();
    // 从路由中获取课程ID（确保路由配置为 /student/course/:id）
    const courseId = Number(route.params.id);
    const assignments = ref<any[]>([]);

    // 辅助函数：构造带有 token 的请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    const loadAssignments = async () => {
      try {
        // 请求接口获取该课程下的所有作业，接口支持 courseId 参数，并附加 token
        const response = await axios.get('/api/assignments', {
          params: { courseId },
          ...getAuthConfig()
        });
        // 假设后端返回数据中，每个 assignment 包含 submitted 字段，表示当前学生的提交状态
        assignments.value = Array.isArray(response.data)
            ? response.data
            : response.data.data?.assignments || response.data.data || [];
      } catch (error) {
        console.error('Failed to load assignments:', error);
        alert('Failed to load assignments');
      }
    };

    const submitAssignment = async (assignmentId: number) => {
      try {
        // 调用后端提交作业接口，附加 token，并传入 courseId 参数
        await axios.post(`/api/assignments/${assignmentId}/submit`, { courseId }, getAuthConfig());
        alert('Assignment submitted successfully');
        await loadAssignments();
      } catch (error) {
        console.error('Failed to submit assignment:', error);
        alert('Failed to submit assignment');
      }
    };

    onMounted(() => {
      loadAssignments();
    });

    return { assignments, submitAssignment };
  }
};
</script>

<style scoped>
/* 根据需要添加样式 */
</style>