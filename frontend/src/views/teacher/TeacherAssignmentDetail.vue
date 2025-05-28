<!-- ================================ TeacherAssignmentDetail.vue ================================ -->
<template>
  <Panel>
    <template #content>
      <!-- 全局加载动画 -->
      <div v-if="loading" class="flex justify-center items-center py-14">
        <svg class="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none"
             viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
        </svg>
      </div>

      <div v-else class="space-y-8">
        <!-- 作业信息 -->
        <section v-if="assignment" class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 class="text-2xl font-semibold mb-2">{{ assignment.title }}</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-1">{{ assignment.description }}</p>
          <p class="text-sm text-gray-500">提交数：{{ assignment.submissionCount || 0 }}</p>
        </section>
        <p v-else class="text-gray-500">加载作业信息...</p>

        <!-- 分析操作 -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h3 class="text-lg font-medium">分析报告</h3>

          <template v-if="analysisStatus">
            <p>
              状态：
              <span :class="statusColor">{{ analysisStatus.status }}</span>
            </p>
            <div v-if="analysisStatus.progress !== undefined"
                 class="w-full bg-gray-200 h-2 rounded overflow-hidden">
              <div class="h-full bg-indigo-500 transition-all"
                   :style="{ width: analysisStatus.progress + '%' }"/>
            </div>
          </template>

          <button v-if="!analysisRunning"
                  @click="startAnalysis"
                  class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow">
            启动分析
          </button>
          <button v-else disabled class="px-4 py-2 bg-gray-400 text-white rounded-lg">分析中...</button>
        </section>

        <!-- 过滤器与预设 -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h3 class="text-lg font-medium">过滤条件</h3>
            <div class="flex items-center gap-3">
              <label for="presetSelect" class="text-sm">筛选预设：</label>
              <select id="presetSelect" v-model="selectedPreset" @change="applyPreset"
                      class="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                <option v-for="p in presets" :key="p.key" :value="p.key">{{ p.name }}</option>
              </select>
              <span class="text-xs text-gray-500">Overall ≥ {{ filter.overall }}</span>
            </div>
          </div>

          <!-- 阈值输入 -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(v, k) in filter" :key="k" class="flex flex-col">
              <label :for="k" class="text-sm mb-1 capitalize">{{ k }} 阈值</label>
              <input type="number"
                     :id="k"
                     v-model.number="filter[k]"
                     step="0.01" min="0" max="1"
                     class="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-400"/>
            </div>
          </div>
          <button @click="applyManualFilter"
                  class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg shadow">
            应用过滤
          </button>
        </section>

        <!-- 可疑提交表 -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6 space-y-4">
          <h3 class="text-lg font-medium">可疑提交 ({{ suspiciousRate }}%)</h3>
          <div v-if="suspicious.length" class="overflow-x-auto">
            <table class="min-w-full text-sm text-left">
              <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2">学号</th>
                <th class="px-3 py-2">姓名</th>
                <th class="px-3 py-2">Overall(%)</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="row in suspicious" :key="row.studentId" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-3 py-2">{{ row.studentId }}</td>
                <td class="px-3 py-2">{{ row.studentName }}</td>
                <td class="px-3 py-2">{{ row.score.toFixed(1) }}</td>
              </tr>
              </tbody>
            </table>
          </div>
          <p v-else class="text-gray-500">无可疑提交记录</p>
        </section>

        <!-- 抄袭关系图 -->
        <section v-if="showGraph" class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-medium mb-4">抄袭关系网络图</h3>
          <div ref="networkChart" class="w-full h-[500px]"/>
        </section>

        <!-- 提交表 -->
        <section class="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h3 class="text-lg font-medium mb-4">学生提交</h3>

          <div v-if="submissions.length" class="overflow-x-auto">
            <table class="min-w-full text-sm text-left">
              <thead class="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2">学号</th>
                <th class="px-3 py-2">姓名</th>
                <th class="px-3 py-2">邮箱</th>
                <th class="px-3 py-2">提交时间</th>
                <th class="px-3 py-2">操作</th>
              </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-for="s in submissions" :key="s.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td class="px-3 py-2">{{ s.studentId }}</td>
                <td class="px-3 py-2">{{ s.student.name }}</td>
                <td class="px-3 py-2">{{ s.student.email }}</td>
                <td class="px-3 py-2">{{ formatDate(s.submittedAt) }}</td>
                <td class="px-3 py-2">
                  <button @click="downloadSubmission(s.id, s.student.name)"
                          class="px-2 py-1 text-xs bg-indigo-500 hover:bg-indigo-600 text-white rounded">
                    下载
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>

          <p v-else class="text-gray-500">暂无提交记录</p>
        </section>

        <button @click="goBack"
                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg shadow">
          返回课程
        </button>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useStore} from 'vuex';
import axios from 'axios';
import * as echarts from 'echarts';
import Panel from "@/components/Layout/Panel.vue";

const route = useRoute();
const router = useRouter();
const store = useStore();
const assignmentId = Number(route.params.assignmentId);
const courseId = Number(route.params.courseId);

/* ─────────────── 状态 ─────────────── */
const loading = ref(true);
const assignment = ref<any>(null);
const submissions = ref<any[]>([]);
const analysisStatus = ref<any>(null);
const analysisRunning = ref(false);
const analysisTaskId = ref('');
let pollTimer: number | undefined;

const networkChart = ref<HTMLElement | null>(null);
let chartInstance: echarts.ECharts | null = null;

// 默认阈值
const filter = ref({overall: 0.7, text: 0.5, image: 0.5, structure: 0.5, metadata: 0.5});

/* 预设：严格/宽松仅根据 Overall 过滤；自定义可多维度调节 */
const presets = [
  {key: 'strict', name: '严格', overall: 0.8},
  {key: 'lenient', name: '宽松', overall: 0.5},
  {key: 'custom', name: '自定义', overall: 0.6, text: 0.5, image: 0.5, structure: 0.5, metadata: 0.5}
] as const;
const selectedPreset = ref<typeof presets[number]['key']>('strict');

/* ─────────────── 计算可疑提交 ─────────────── */
const suspicious = computed(() => {
  if (!analysisStatus.value?.result?.comparisons) return [];
  const {nodes, links} = computeGraph();
  if (!nodes.length) return [];

  // 取每个节点连接边上的最高 overall 相似度，转换为百分比
  const maxOverall = new Map<string, number>();
  links.forEach((l: any) => {
    maxOverall.set(String(l.source), Math.max(maxOverall.get(String(l.source)) || 0, l.value));
    maxOverall.set(String(l.target), Math.max(maxOverall.get(String(l.target)) || 0, l.value));
  });

  return nodes.map((n: any) => ({
    studentId: n.id,
    studentName: n.name,
    score: (maxOverall.get(String(n.id)) || 0) * 100
  })).sort((a, b) => b.score - a.score);
});

const suspiciousRate = computed(() => submissions.value.length
    ? Math.round((suspicious.value.length / submissions.value.length) * 100)
    : 0);

/* ─────────────── API helpers ─────────────── */
const authCfg = () => ({headers: {Authorization: `Bearer ${store.state.currentUser?.token}`}});
const parse = (r: any) => r.data && r.data.success ? r.data.data : Promise.reject(r.data?.message);

/* ─────────────── 数据加载 ─────────────── */
const loadAssignment = () => axios.get(`/api/assignments/${assignmentId}`, authCfg()).then(parse).then(d => {
  assignment.value = d.assignment || d;
});
const loadSubmissions = () => axios
    .get(`/api/assignments/${assignmentId}/submissions`, authCfg())
    .then(parse)
    .then(d => {
      submissions.value = d.submissions || d;
    });

/* ─────────────── 分析任务 ─────────────── */
const startAnalysis = () => {
  axios.post(`/api/analysis/${assignmentId}`, {}, authCfg()).then(parse).then(d => {
    analysisTaskId.value = d.taskId;
    analysisRunning.value = true;
    pollTimer = window.setInterval(pollStatus, 2000);
  });
};
const pollStatus = () => {
  axios.get(`/api/analysis/${analysisTaskId.value}`, authCfg()).then(r => {
    analysisStatus.value = r.data.data;
    if (r.data.data.status === 'completed') {
      analysisRunning.value = false;
      clearInterval(pollTimer);
      nextTick(() => {
        initNetworkChart();
      });
    }
  });
};

/* ─────────────── 图表 ─────────────── */
const computeGraph = () => {
  const res = analysisStatus.value;
  if (!res?.result?.comparisons || !res.submissionInfos) return {nodes: [], links: []};

  const onlyOverall = ['strict', 'lenient'].includes(selectedPreset.value);
  const map = new Map(res.submissionInfos.map((i: any) => [i.filePath, i]));
  const edges = res.result.comparisons
      .filter((c: any) => {
        const basic = c.overallSimilarity >= filter.value.overall;
        if (!basic) return false;
        if (onlyOverall) return true;
        return c.textSimilarity >= filter.value.text &&
            c.imageSimilarity >= filter.value.image &&
            c.structureSimilarity >= filter.value.structure &&
            c.metadataSimilarity >= filter.value.metadata;
      })
      .map((c: any) => {
        const a = map.get(c.fileA), b = map.get(c.fileB);
        if (!(a && b)) return null;
        return {
          source: {id: String(a.studentId), name: a.studentName},
          target: {id: String(b.studentId), name: b.studentName},
          similarity: c.overallSimilarity,
          details: {
            text: c.textSimilarity, image: c.imageSimilarity,
            structure: c.structureSimilarity, metadata: c.metadataSimilarity
          }
        };
      }).filter(Boolean);

  const nodeMap = new Map<string, any>();
  edges.forEach((e: any) => {
    nodeMap.set(e.source.id, e.source);
    nodeMap.set(e.target.id, e.target);
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: edges.map((e: any) => ({source: e.source.id, target: e.target.id, value: e.similarity, info: e}))
  };
};

const initNetworkChart = () => {
  if (!networkChart.value) return;
  if (chartInstance) {
    chartInstance.dispose();
    chartInstance = null;
  }

  const {nodes, links} = computeGraph();
  chartInstance = echarts.init(networkChart.value);
  chartInstance.setOption({
    tooltip: {
      formatter: ({dataType, data}: any) =>
          dataType === 'edge'
              ? `从 <b>${data.info.source.name}</b> 到 <b>${data.info.target.name}</b><br/>
           Overall: ${(data.value * 100).toFixed(1)}%<br/>
           Text: ${(data.info.details.text * 100).toFixed(1)}%<br/>
           Image: ${(data.info.details.image * 100).toFixed(1)}%<br/>
           Structure: ${(data.info.details.structure * 100).toFixed(1)}%<br/>
           Metadata: ${(data.info.details.metadata * 100).toFixed(1)}%`
              : data.name
    },
    series: [{
      type: 'graph', layout: 'force', roam: true,
      label: {show: true, formatter: '{b}'},
      force: {repulsion: 100, edgeLength: [50, 200]},
      data: nodes, links,
      lineStyle: {color: 'source', curveness: 0.3}
    }]
  });
  chartInstance.on('click', ({dataType, data}: any) => {
    if (dataType !== 'node') return;
    const list = submissions.value.filter(s => String(s.studentId) === data.id);
    if (!list.length) return alert('未找到对应的提交记录');
    downloadSubmission(list[0].id, list[0].student.name);
  });
};

/* ─────────────── 过滤交互 ─────────────── */
const applyPreset = () => {
  const p = presets.find(p => p.key === selectedPreset.value)!;
  // 只更新已有字段，避免响应式丢失
  Object.keys(filter.value).forEach(k => {
    if (p[k as keyof typeof p] !== undefined) {
      // @ts-ignore
      filter.value[k] = p[k];
    }
  });
  if (analysisStatus.value?.status === 'completed') initNetworkChart();
};
const applyManualFilter = () => {
  if (analysisStatus.value?.status === 'completed') initNetworkChart();
};

/* ─────────────── 其它工具 ─────────────── */
const downloadSubmission = (id: number, name: string) => {
  axios.get(`/api/assignments/${id}/download`, {...authCfg(), responseType: 'blob'})
      .then(r => {
        const url = URL.createObjectURL(new Blob([r.data]));
        const link = Object.assign(document.createElement('a'), {
          href: url,
          download: `${name}-${assignmentId}.docx`
        });
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
};
const formatDate = (d: string) => new Date(d).toLocaleString();
const goBack = () => router.push(`/teacher/course/${courseId}`);
const showGraph = computed(() => analysisStatus.value?.status === 'completed');

const statusColor = computed(() =>
    analysisStatus.value?.status === 'completed' ? 'text-green-600'
        : analysisStatus.value?.status === 'running' ? 'text-yellow-500'
            : 'text-red-500');

/* ─────────────── 生命周期 ─────────────── */
onMounted(async () => {
  try {
    await Promise.all([loadAssignment(), loadSubmissions()]);
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

watch(selectedPreset, applyPreset);

onBeforeUnmount(() => {
  clearInterval(pollTimer);
  chartInstance?.dispose();
});
</script>

<style scoped>
/* 在此可补充局部样式 */
</style>
