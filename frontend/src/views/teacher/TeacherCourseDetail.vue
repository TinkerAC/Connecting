<!-- frontend/src/views/TeacherCourseDetail.vue -->
<template>
  <Panel>
    <template #content>
      <h2>Course Details (Teacher)</h2>

      <!-- 课程基本信息 -->
      <section v-if="course">
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
        <p>Teacher ID: {{ course.teacherId }}</p>
      </section>

      <!-- 课程作业部分 -->
      <section>
        <h3>Assignments</h3>
        <div v-if="assignments.length">
          <ul>
            <li v-for="assignment in assignments" :key="assignment.id">
              <div>
                <strong>{{ assignment.title }}</strong>
                <p>{{ assignment.description }}</p>
                <p>
                  Student Submissions:
                  <span>{{ assignment.submissionCount || 0 }}</span>
                </p>
                <!-- 新增按钮：查看作业分析 -->
                <button @click="viewAnalysis(assignment.id)">查看分析</button>
              </div>
            </li>
          </ul>
        </div>
        <div v-else>
          <p>No assignments found.</p>
        </div>
        <button @click="toggleNewForm">
          {{ showNewForm ? 'Cancel' : 'Publish New Assignment' }}
        </button>
        <div v-if="showNewForm" class="new-assignment-form">
          <h3>New Assignment</h3>
          <form @submit.prevent="publishAssignment">
            <div>
              <label for="newTitle">Title:</label>
              <input type="text" id="newTitle" v-model="newAssignment.title" required />
            </div>
            <div>
              <label for="newDescription">Description:</label>
              <textarea id="newDescription" v-model="newAssignment.description" required></textarea>
            </div>
            <button type="submit">Publish</button>
          </form>
        </div>
      </section>

      <!-- 学生名单部分 -->
      <section style="margin-top:20px;">
        <h3>Enrolled Students</h3>
        <div v-if="students.length">
          <table border="1" cellspacing="0" cellpadding="5">
            <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="student in students" :key="student.id">
              <td>{{ student.id }}</td>
              <td>{{ student.username }}</td>
              <td>{{ student.email || '-' }}</td>
            </tr>
            </tbody>
          </table>
        </div>
        <div v-else>
          <p>No students enrolled.</p>
        </div>
      </section>

    </template>
  </Panel>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'TeacherCourseDetail',
  components: { Panel },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    // 从路由参数中获取课程ID
    const courseId = Number(route.params.id);

    const course = ref<any>(null);
    const assignments = ref<any[]>([]);
    const students = ref<any[]>([]);
    const showNewForm = ref(false);
    const newAssignment = ref({
      title: '',
      description: ''
    });

    // 构造附带 token 的请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    // 加载课程基本信息
    const loadCourseDetails = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}`, getAuthConfig());
        course.value = response.data.data?.course || response.data.data;
      } catch (error) {
        console.error('Failed to load course details:', error);
        alert('Failed to load course details');
      }
    };

    // 加载指定课程下的作业列表
    const loadAssignments = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/assignments`, getAuthConfig());
        assignments.value = Array.isArray(response.data)
            ? response.data
            : response.data.data?.assignments || response.data.data || [];
      } catch (error) {
        console.error('Failed to load assignments:', error);
        alert('Failed to load assignments');
      }
    };

    // 加载该课程的学生名单
    const loadStudents = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/students`, getAuthConfig());
        students.value = response.data.data?.students || response.data.data || [];
      } catch (error) {
        console.error('Failed to load students:', error);
        alert('Failed to load students');
      }
    };

    // 发布新作业
    const publishAssignment = async () => {
      try {
        await axios.post('/api/assignments', {
          courseId,
          title: newAssignment.value.title,
          description: newAssignment.value.description
        }, getAuthConfig());
        alert('Assignment published successfully');
        await loadAssignments();
        newAssignment.value.title = '';
        newAssignment.value.description = '';
        showNewForm.value = false;
      } catch (error) {
        console.error('Failed to publish assignment:', error);
        alert('Failed to publish assignment');
      }
    };

    const toggleNewForm = () => {
      showNewForm.value = !showNewForm.value;
    };

    // 当点击查看分析按钮时，跳转到教师作业分析页面，URL 格式为 /teacher/course/:courseId/assignment/:assignmentId
    const viewAnalysis = (assignmentId: number) => {
      router.push(`/teacher/course/${courseId}/assignment/${assignmentId}`);
    };

    onMounted(() => {
      loadCourseDetails();
      loadAssignments();
      loadStudents();
    });

    return {
      course,
      assignments,
      students,
      showNewForm,
      newAssignment,
      publishAssignment,
      toggleNewForm,
      viewAnalysis,
    };
  }
};
</script>

<style scoped>
.new-assignment-form {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
table th,
table td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ccc;
}
</style>