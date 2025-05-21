<!-- ========= frontend/src/views/student/StudentDashboard.vue ========= -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">学生主页</h2>

      <!-- 指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <MetricCard v-for="m in metrics" :key="m.title" v-bind="m" />
      </div>

      <!-- 图表区 -->
      <ChartCard title="提交进度折线"       :option="lineOption" height="320px" />
      <ChartCard title="各作业相似度分布"   :option="barOption"  height="320px" />
      <ChartCard title="当前总分占比"       :option="pieOption"  height="340px" />

      <!-- 当前可提交作业 -->
      <h3 class="text-xl font-semibold mb-4 mt-10">待提交作业</h3>
      <ul class="space-y-4">
        <li v-for="a in assignments" :key="a.id"
            class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg shadow flex justify-between items-center">
          <span>{{ a.title }}</span>
          <button @click="selectAssignment(a)"
                  class="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">提交作业</button>
        </li>
      </ul>

      <!-- 提交区 -->
      <div v-if="selectedAssignment" class="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow space-y-4">
        <h3 class="text-lg font-medium">提交：{{ selectedAssignment.title }}</h3>
        <input type="file" accept=".doc,.docx" @change="handleFileUpload"
               class="w-full text-sm text-gray-500 file:mr-4 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-gray-200 dark:file:bg-gray-600 file:text-gray-700 dark:file:text-gray-100"/>
        <button @click="submitAssignment"
                class="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white">确认提交</button>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted, defineComponent, h } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { useStore } from 'vuex';
import Panel from '@/components/Layout/Panel.vue';
import { ClipboardList, BookOpen, AlertCircle } from 'lucide-vue-next';

/* ---------------- MetricCard ---------------- */
const MetricCard = defineComponent({
  name: 'MetricCard',
  props: {
    title: { type: String, required: true },
    value: { type: [String, Number], required: true },
    icon:  { type: [Object, Function], required: true }
  },
  setup(props) {
    return () => h('div', { class: 'p-4 rounded-xl bg-white dark:bg-gray-800 shadow flex items-center gap-3' }, [
      h(props.icon as any, { class: 'w-6 h-6 text-indigo-600' }),
      h('div', {}, [h('p', { class: 'text-xs text-gray-500' }, props.title), h('p', { class: 'text-lg font-semibold' }, String(props.value))])
    ]);
  }
});

/* ---------------- ChartCard ---------------- */
const ChartCard = defineComponent({
  name: 'ChartCard',
  props: {
    title: { type: String, required: true },
    option: { type: Object, required: true },
    height: { type: String, default: '300px' }
  },
  setup(props) {
    const el = ref<HTMLElement | null>(null);
    onMounted(() => {
      if (!el.value) return;
      const chart = echarts.init(el.value);
      chart.setOption(props.option as any);
      window.addEventListener('resize', () => chart.resize());
    });
    return () => h('section', { class: 'bg-white dark:bg-gray-800 rounded-xl shadow p-4 my-8' }, [
      h('h4', { class: 'text-sm font-medium mb-2' }, props.title),
      h('div', { ref: el, style: { width: '100%', height: props.height } })
    ]);
  }
});

/* ---------------- Mock 数据 ---------------- */
const mockAssignments = [
  { id: 1, title: '线性代数第1次作业' },
  { id: 2, title: '编译原理语法分析' }
];
const mockProgress   = [20, 40, 60, 80, 100];
const mockSimilarity = [0.35, 0.42, 0.38, 0.51, 0.45];
const mockGradeRatio = [
  { name: '已完成', value: 5 },
  { name: '待批改', value: 2 },
  { name: '缺交',   value: 1 }
];

/* ---------------- 指标 ---------------- */
const metrics = [
  { title: '已提交作业', value: 5, icon: ClipboardList },
  { title: '待提交',     value: mockAssignments.length, icon: BookOpen },
  { title: '可疑率',     value: '4.8%', icon: AlertCircle }
];

/* ---------------- ECharts option ---------------- */
const lineOption = {
  tooltip:{ trigger:'axis' },
  xAxis:{ type:'category', data: ['周一','周二','周三','周四','周五'] },
  yAxis:{ type:'value', min:0, max:100 },
  series:[{ type:'line', data: mockProgress, areaStyle:{} }]
};
const barOption = {
  tooltip:{ trigger:'axis' },
  xAxis:{ type:'category', data:['作业1','作业2','作业3','作业4','作业5'] },
  yAxis:{ type:'value', min:0, max:1 },
  series:[{ type:'bar', data: mockSimilarity.map(v=>+v.toFixed(2)) }]
};
const pieOption = {
  tooltip:{ trigger:'item' },
  series:[{ type:'pie', radius:['30%','70%'], label:{ formatter:'{b}: {d}%' }, data: mockGradeRatio }]
};

/* ---------------- 上传逻辑，与后端保持兼容 ---------------- */
const store = useStore();
const assignments = ref<any[]>([]);
const selectedAssignment = ref<any>(null);
const file = ref<File | null>(null);
const auth = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadAssignments = () => {
  // 用 mock 数据，若接后端可替换
  assignments.value = mockAssignments;
};

const selectAssignment = (a: any) => { selectedAssignment.value = a; };
const handleFileUpload = (e: Event) => { const f=(e.target as HTMLInputElement).files; if(f&&f[0]) file.value=f[0]; };
const submitAssignment = async () => {
  if(!file.value||!selectedAssignment.value) return alert('请选择作业和文件');
  const fd=new FormData(); fd.append('file',file.value); fd.append('assignmentId',selectedAssignment.value.id);
  try{ await axios.post('/api/assignments/submit',fd,{ headers:{...auth().headers,'Content-Type':'multipart/form-data'} });
    alert('提交成功'); file.value=null; selectedAssignment.value=null;
  }catch{ alert('提交失败(已mock)'); }
};

onMounted(loadAssignments);
</script>

<style scoped></style>
