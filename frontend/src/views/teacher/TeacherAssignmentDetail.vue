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
        <img src="" alt="Analysis Report Placeholder" style="max-width: 100%;" />
        <div v-if="analysisStatus">
          <p>Status: {{ analysisStatus.status }}</p>
          <p>Progress: {{ analysisStatus.progress }}%</p>
        </div>
        <div v-if="!analysisRunning">
          <button @click="startAnalysis">Start Analysis</button>
        </div>
      </section>

      <!-- 多重过滤器设置 -->
      <section style="margin-top:20px;">
        <h3>Filter Options</h3>
        <div>
          <label>Overall Similarity Threshold:</label>
          <input type="number" v-model.number="filter.overall" step="0.01" min="0" max="1" />
        </div>
        <div>
          <label>Text Similarity Threshold:</label>
          <input type="number" v-model.number="filter.text" step="0.01" min="0" max="1" />
        </div>
        <div>
          <label>Image Similarity Threshold:</label>
          <input type="number" v-model.number="filter.image" step="0.01" min="0" max="1" />
        </div>
        <div>
          <label>Structure Similarity Threshold:</label>
          <input type="number" v-model.number="filter.structure" step="0.01" min="0" max="1" />
        </div>
        <div>
          <label>Metadata Similarity Threshold:</label>
          <input type="number" v-model.number="filter.metadata" step="0.01" min="0" max="1" />
        </div>
        <button @click="initNetworkChart">Apply Filter</button>
      </section>

      <!-- 分析结果展示：抄袭网络图 -->
      <section style="margin-top:20px;"
               v-if="analysisStatus && analysisStatus.status === 'completed' && analysisStatus.result && analysisStatus.submissionInfos">
        <h3>Plagiarism Network Graph</h3>
        <div ref="networkChart" style="width: 100%; height: 500px;"></div>
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
            <td>{{ submission.student.name }}</td>
            <td>{{ submission.student.email }}</td>
            <td>{{ formatDate(submission.submittedAt) }}</td>
            <td>
              <button @click="downloadSubmission(submission.id, submission.student.name)">Download File</button>
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
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useStore } from 'vuex';
import * as echarts from 'echarts';

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
    // analysisStatus 包含后端返回的 submissionInfos、result.comparisons 以及 status 等字段
    const analysisStatus = ref<any>(null);
    const analysisRunning = ref(false);
    const analysisTaskId = ref<string>('');
    let pollInterval: number | undefined = undefined;

    // ECharts 容器引用
    const networkChart = ref<HTMLElement | null>(null);
    let chartInstance: echarts.ECharts | null = null;

    // 过滤条件：多种相似度过滤同时生效
    const filter = ref({
      overall: 0.7,
      text: 0.5,
      image: 0.5,
      structure: 0.5,
      metadata: 0.5
    });

    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    const parseResponse = (response: any) => {
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Unknown error');
    };

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

    const startAnalysis = async () => {
      try {
        const response = await axios.post(`/api/analysis/${assignmentId}`, {}, getAuthConfig());
        const data = parseResponse(response);
        analysisTaskId.value = data.taskId;
        analysisRunning.value = true;
        startPolling();
      } catch (error: any) {
        console.error('Failed to start analysis:', error);
        alert('Failed to start analysis: ' + error.message);
      }
    };

    const pollAnalysisStatus = async () => {
      try {
        const response = await axios.get(`/api/analysis/${analysisTaskId.value}`, getAuthConfig());
        // 假设后端返回的数据包含 submissionInfos 与 result.comparisons 以及 status
        const data = response.data.data;
        analysisStatus.value = data;
        if (data.status === 'completed') {
          analysisRunning.value = false;
          clearInterval(pollInterval);
          await nextTick(() => {
            initNetworkChart();
          });
        }
      } catch (error: any) {
        console.error('Failed to load analysis status:', error);
      }
    };

    const startPolling = () => {
      pollInterval = window.setInterval(pollAnalysisStatus, 2000);
    };

    // 根据 submissionInfos、comparisons 和过滤条件构造网络图数据
    const computePlagiarismNetwork = () => {
      if (!analysisStatus.value || !analysisStatus.value.result || !analysisStatus.value.submissionInfos) {
        return { nodes: [], links: [] };
      }
      const comparisons = analysisStatus.value.result.comparisons;
      const submissionInfos = analysisStatus.value.submissionInfos;
      // 构造文件路径到提交信息的映射
      const fileMap = new Map();
      submissionInfos.forEach(info => {
        fileMap.set(info.filePath, info);
      });
      // 根据过滤条件过滤比较结果
      const edges = comparisons
          .filter(comp =>
              comp.overallSimilarity >= filter.value.overall &&
              comp.textSimilarity >= filter.value.text &&
              comp.imageSimilarity >= filter.value.image &&
              comp.structureSimilarity >= filter.value.structure &&
              comp.metadataSimilarity >= filter.value.metadata
          )
          .map(comp => {
            const sourceInfo = fileMap.get(comp.fileA);
            const targetInfo = fileMap.get(comp.fileB);
            if (sourceInfo && targetInfo) {
              return {
                source: { id: String(sourceInfo.studentId), name: sourceInfo.studentName },
                target: { id: String(targetInfo.studentId), name: targetInfo.studentName },
                similarity: comp.overallSimilarity,
                details: {
                  text: comp.textSimilarity,
                  image: comp.imageSimilarity,
                  structure: comp.structureSimilarity,
                  metadata: comp.metadataSimilarity
                }
              };
            }
            return null;
          })
          .filter(edge => edge !== null);

      // 根据 edges 去重节点（以学生 id 为 key，转换为字符串）
      const nodeMap = new Map();
      edges.forEach((edge: any) => {
        nodeMap.set(edge.source.id, edge.source);
        nodeMap.set(edge.target.id, edge.target);
      });
      const nodes = Array.from(nodeMap.values());
      // 将额外信息存储到 info 字段，避免被 ECharts 内部覆盖
      const links = edges.map((edge: any) => ({
        source: edge.source.id,
        target: edge.target.id,
        value: edge.similarity,
        info: edge
      }));
      return { nodes, links };
    };

    // 初始化并绘制图表
    const initNetworkChart = () => {
      // 如果已有实例，则移除 click 事件并销毁实例
      if (chartInstance) {
        chartInstance.off('click');
        chartInstance.dispose();
        chartInstance = null;
      }
      const { nodes, links } = computePlagiarismNetwork();
      if (!networkChart.value) return;
      chartInstance = echarts.init(networkChart.value);
      const option = {
        title: {
          text: 'Plagiarism Network Graph',
          subtext: 'Filter: 多条件生效，显示详细对比信息',
          left: 'center'
        },
        tooltip: {
          formatter: function (params: any) {
            if (params.dataType === 'edge') {
              const edge = params.data.info;
              return `
                从 <b>${edge.source.name}</b> 到 <b>${edge.target.name}</b><br/>
                Overall: ${edge.similarity}<br/>
                Text: ${edge.details.text}<br/>
                Image: ${edge.details.image}<br/>
                Structure: ${edge.details.structure}<br/>
                Metadata: ${edge.details.metadata}
              `;
            } else {
              return params.data.name;
            }
          }
        },
        series: [
          {
            type: 'graph',
            layout: 'force',
            roam: true,
            // 移除了 edgeSymbol 配置，不显示箭头
            label: {
              show: true,
              formatter: '{b}'
            },
            force: {
              repulsion: 100,
              edgeLength: [50, 200]
            },
            data: nodes,
            links: links,
            lineStyle: {
              color: 'source',
              curveness: 0.3
            }
          }
        ]
      };
      chartInstance.setOption(option);

      // 移除重复 click 事件后绑定点击事件
      chartInstance.off('click');
      chartInstance.on('click', function (params: any) {
        if (params.dataType === 'node') {
          const studentId = params.data.id;
          // 查找该学生对应的提交记录（转换为字符串匹配）
          const studentSubmissions = submissions.value.filter(s => String(s.studentId) === studentId);
          if (!studentSubmissions || studentSubmissions.length === 0) {
            alert('未找到对应的提交记录');
          } else if (studentSubmissions.length === 1) {
            downloadSubmission(studentSubmissions[0].id, studentSubmissions[0].student.name);
          } else {
            if (confirm('该学生存在多个提交记录，是否只下载第一个？')) {
              downloadSubmission(studentSubmissions[0].id, studentSubmissions[0].student.name);
            }
          }
        }
      });
    };

    const goBack = () => {
      router.push(`/teacher/course/${courseId}`);
    };

    // 修改 downloadSubmission，使用 {studentName}-{assignmentId}.docx 作为文件名
    const downloadSubmission = async (submissionId: number, studentName: string) => {
      try {
        const config = {
          ...getAuthConfig(),
          responseType: 'blob'
        };
        const response = await axios.get(`/api/assignments/${submissionId}/download`, config);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${studentName}-${assignmentId}.docx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download submission:', error);
        alert('下载失败');
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

    onBeforeUnmount(() => {
      if (pollInterval) clearInterval(pollInterval);
      if (chartInstance) chartInstance.dispose();
    });

    watch(analysisStatus, (newVal) => {
      if (newVal && newVal.status === 'completed') {
        nextTick(() => {
          initNetworkChart();
        });
      }
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
      networkChart,
      filter,
      initNetworkChart
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