<!-- frontend/src/views/StudentCourseDetail.vue -->
<template>
  <Panel>
    <template #content>
      <h2>Course Details (Student)</h2>
      <!-- 显示课程基本信息 -->
      <div v-if="course">
        <h3>{{ course.title }}</h3>
        <p>{{ course.description }}</p>
      </div>

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
              <!-- 如果当前作业未提交，并且没有正在选择文件，则显示选择文件按钮 -->
              <div v-if="!assignment.submitted && selectedAssignmentId !== assignment.id">
                <button @click="selectFile(assignment.id)">选择提交文件</button>
              </div>
              <!-- 如果当前作业正在选择文件，则显示文件预览和提交、取消按钮 -->
              <div v-else-if="selectedAssignmentId === assignment.id">
                <p>已选择文件：{{ selectedFile?.name }}</p>
                <button @click="submitAssignment(assignment.id)">确认提交</button>
                <button @click="cancelSelection">取消</button>
              </div>
            </div>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>No assignments found.</p>
      </div>
      <!-- 隐藏的文件上传输入框 -->
      <input
          type="file"
          ref="fileInput"
          style="display: none"
          @change="handleFileChange"
      />
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
    // 从路由参数中获取课程ID
    const courseId = Number(route.params.id);

    const course = ref<any>(null);
    const assignments = ref<any[]>([]);
    const selectedAssignmentId = ref<number | null>(null);
    const selectedFile = ref<File | null>(null);
    const fileInput = ref<HTMLInputElement | null>(null);

    // 构造带有 token 的请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    // 加载当前课程基本信息
    const loadCourseDetails = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}`, getAuthConfig());
        course.value = response.data.data?.course || response.data.data;
      } catch (error) {
        console.error('Failed to load course details:', error);
        // 非关键错误，可忽略或提示
      }
    };

    // 加载作业列表：调用新接口 /api/courses/:courseId/assignments
    const loadAssignments = async () => {
      try {
        const response = await axios.get(`/api/courses/${courseId}/assignments`, getAuthConfig());
        // 如果返回的是数组，直接赋值；否则根据返回结构解析
        assignments.value = Array.isArray(response.data)
            ? response.data
            : response.data.data?.assignments || response.data.data || [];
      } catch (error) {
        console.error('Failed to load assignments:', error);
        alert('Failed to load assignments');
      }
    };

    // 选择文件：记录作业ID，并触发隐藏的文件选择框
    const selectFile = (assignmentId: number) => {
      selectedAssignmentId.value = assignmentId;
      if (fileInput.value) {
        fileInput.value.value = ''; // 重置输入框
        fileInput.value.click();
      }
    };

    // 处理文件选择
    const handleFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
      }
    };

    // 提交作业：构造 FormData 并调用后端接口
    const submitAssignment = async (assignmentId: number) => {
      if (!selectedFile.value) {
        alert('请先选择文件');
        return;
      }
      const formData = new FormData();
      formData.append('file', selectedFile.value);
      // 如果后端需要 courseId 作为附加参数
      formData.append('courseId', String(courseId));
      try {
        await axios.post(`/api/assignments/${assignmentId}/submit`, formData, {
          headers: {
            ...getAuthConfig().headers,
            'Content-Type': 'multipart/form-data'
          }
        });
        alert('Assignment submitted successfully');
        selectedAssignmentId.value = null;
        selectedFile.value = null;
        await loadAssignments();
      } catch (error) {
        console.error('Failed to submit assignment:', error);
        alert('Failed to submit assignment');
      }
    };

    const cancelSelection = () => {
      selectedAssignmentId.value = null;
      selectedFile.value = null;
    };

    onMounted(() => {
      loadCourseDetails();
      loadAssignments();
    });

    return {
      course,
      assignments,
      selectedAssignmentId,
      selectedFile,
      fileInput,
      selectFile,
      handleFileChange,
      submitAssignment,
      cancelSelection,
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
ul {
  list-style: none;
  padding: 0;
}
li {
  margin-bottom: 10px;
}
</style>