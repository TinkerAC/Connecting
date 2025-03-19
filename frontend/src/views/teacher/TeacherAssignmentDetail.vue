<!-- frontend/src/views/TeacherAssignmentDetail.vue -->
<template>
  <Panel>
    <template #content>
      <h2>Assignment Analysis (Teacher)</h2>

      <!-- 作业基本信息 -->
      <section v-if="assignment">
        <h3>{{ assignment.title }}</h3>
        <p>{{ assignment.description }}</p>
        <p>Submission Count: {{ assignment.submissionCount || 0 }}</p>
      </section>
      <section v-else>
        <p>Loading assignment details...</p>
      </section>

      <!-- 分析操作区域 -->
      <section style="margin-top:20px;">
        <h3>Analysis Report</h3>
        <!-- 显示占位符图像 -->
        <img src="" alt="Analysis Report Placeholder" style="max-width: 100%;" />
        <!-- 分析状态显示 -->
        <div v-if="analysisStatus">
          <p>Status: {{ analysisStatus.status }}</p>
          <p>Progress: {{ analysisStatus.progress }}%</p>
        </div>
        <!-- 启动分析按钮，仅当任务未启动或已完成时显示 -->
        <div v-if="!analysisRunning">
          <button @click="startAnalysis">Start Analysis</button>
        </div>
      </section>

      <!-- 提交记录列表 -->
      <section style="margin-top:20px;" v-if="submissions.length">
        <h3>Student Submissions</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <thead>
          <tr>
            <th>Student ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Submitted At</th>
            <th>Action</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="submission in submissions" :key="submission.id">
            <td>{{ submission.studentId }}</td>
            <td>-</td>
            <td>-</td>
            <td>{{ formatDate(submission.submittedAt) }}</td>
            <td>
              <button @click="downloadSubmission(submission.id)">Download File</button>
            </td>
          </tr>
          </tbody>
        </table>
      </section>
      <section v-else style="margin-top:20px;">
        <p>No submissions found.</p>
      </section>

      <!-- 返回按钮 -->
      <button @click="goBack" style="margin-top:20px;">Back to Course Details</button>
    </template>
  </Panel>
</template>

<script lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'TeacherAssignmentDetail',
  components: { Panel },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const assignmentId = Number(route.params.assignmentId);
    const courseId = Number(route.params.courseId);

    const assignment = ref<any>(null);
    const submissions = ref<any[]>([]);
    const analysisStatus = ref<{ progress: number; status: string } | null>(null);
    const analysisRunning = ref(false);
    let pollInterval: number | undefined = undefined;

    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    // 统一处理响应（简单示例）
    const parseResponse = (response: any) => {
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Unknown error');
    };

    // 加载作业详情
    const loadAssignmentDetail = async () => {
      try {
        const response = await axios.get(`/api/assignments/${assignmentId}`, getAuthConfig());
        const data = parseResponse(response);
        assignment.value = data.assignment || data;
      } catch (error: any) {
        console.error('Failed to load assignment detail:', error);
        alert('Failed to load assignment detail: ' + error.message);
      }
    };

    // 加载提交记录
    const loadSubmissions = async () => {
      try {
        const response = await axios.get(`/api/assignments/${assignmentId}/submissions`, getAuthConfig());
        const data = parseResponse(response);
        submissions.value = data.submissions || data;
      } catch (error: any) {
        console.error('Failed to load submissions:', error);
        alert('Failed to load submissions: ' + error.message);
      }
    };

    // 启动分析任务
    const startAnalysis = async () => {
      try {
        // 发送 POST 请求启动分析任务
        const response = await axios.post(
            `/api/assignments/${assignmentId}/analyze`,
            {},
            getAuthConfig()
        );
        // 分析任务启动后，设置状态并开始轮询
        analysisRunning.value = true;
        pollAnalysisStatus();
      } catch (error: any) {
        console.error('Failed to start analysis:', error);
        alert('Failed to start analysis: ' + error.message);
      }
    };

    // 轮询分析状态
    const pollAnalysisStatus = async () => {
      try {
        const response = await axios.get(`/api/assignments/${assignmentId}/analyze/status`, getAuthConfig());
        const data = parseResponse(response);
        analysisStatus.value = data; // data 应包含 { progress: number, status: string }
        if (data.status === 'completed' || data.progress >= 100) {
          analysisRunning.value = false;
          clearInterval(pollInterval);
        }
      } catch (error: any) {
        console.error('Failed to load analysis status:', error);
        // 发生错误时可以选择停止轮询或重试
      }
    };

    // 开始轮询（每 2 秒调用一次）
    const startPolling = () => {
      pollInterval = window.setInterval(pollAnalysisStatus, 2000);
    };

    const goBack = () => {
      router.push(`/teacher/course/${courseId}`);
    };

    const downloadSubmission = async (submissionId: number) => {
      try {
        window.open(`/api/submissions/${submissionId}/download`, '_blank');
      } catch (error) {
        console.error('Failed to download submission:', error);
        alert('Failed to download submission');
      }
    };

    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      return d.toLocaleString();
    };

    onMounted(() => {
      loadAssignmentDetail();
      loadSubmissions();
    });

    // 当分析任务启动时调用 startPolling
    // 我们在 startAnalysis 内部调用 pollAnalysisStatus 后立即启动轮询
    const pollAnalysisStatusWrapper = () => {
      startPolling();
    };

    // 清理轮询定时器
    onBeforeUnmount(() => {
      if (pollInterval) clearInterval(pollInterval);
    });

    return {
      assignment,
      submissions,
      analysisStatus,
      analysisRunning,
      startAnalysis,
      downloadSubmission,
      goBack,
      formatDate,
    };
  }
};
</script>

<style scoped>
img {
  display: block;
  margin: 0 auto;
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