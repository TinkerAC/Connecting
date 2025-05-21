<!-- frontend/src/views/teacher/TeacherDashboard.vue -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">教师主页</h2>

      <!-- 指标卡片 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <MetricCard v-for="m in metrics" :key="m.title" v-bind="m" />
      </div>

      <!-- 图表区 -->
      <ChartCard title="各次作业提交量对比"          :option="barOption" />
      <ChartCard title="抄袭维度评分分布 (雷达)"     :option="radarOption" height="400px" />
      <ChartCard title="平均相似度趋势 (折线)"      :option="lineOption" height="340px" />
      <ChartCard title="最新作业相似度分布 (饼图)"  :option="pieOption"  height="340px" />

      <!-- 发布作业表单 -->
      <h3 class="text-xl font-semibold mb-4">发布新作业</h3>
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
import { ref, onMounted, defineComponent, h } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { useStore } from 'vuex';
import Panel from '@/components/Layout/Panel.vue';
import { ClipboardList, FileText, Users, AlertTriangle } from 'lucide-vue-next';

/* ---------------- 内部组件：指标卡 (渲染函数实现) ---------------- */
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
      h('div', {}, [
        h('p', { class: 'text-xs text-gray-500' }, props.title),
        h('p', { class: 'text-lg font-semibold' }, String(props.value))
      ])
    ]);
  }
});

/* ---------------- 内部组件：图表卡 ---------------- */
const ChartCard = defineComponent({
  name: 'ChartCard',
  props: {
    title: { type: String, required: true },
    option: { type: Object, required: true },
    height: { type: String, default: '300px' }
  },
  setup(props) {
    const chartRef = ref<HTMLElement | null>(null);
    onMounted(() => {
      if (!chartRef.value) return;
      const chart = echarts.init(chartRef.value);
      chart.setOption(props.option as any);
      window.addEventListener('resize', () => chart.resize());
    });
    return () => h('section', { class: 'bg-white dark:bg-gray-800 rounded-xl shadow p-4 my-10' }, [
      h('h4', { class: 'text-sm font-medium mb-2' }, props.title),
      h('div', { ref: chartRef, style: { width: '100%', height: props.height } })
    ]);
  }
});

/* ---------------- Mock 数据 ---------------- */
const mockAssignments = ['一次函数图像','探索电磁感应','古诗鉴赏','数据结构实践','概率论习题'];
const mockSubmission  = [35,50,28,42,61];
const mockAvgSim      = [0.32,0.37,0.35,0.41,0.39];
const simRadar        = [
  { name: '文本', value: 0.68 },
  { name: '图像', value: 0.57 },
  { name: '结构', value: 0.49 },
  { name: '元数据', value: 0.72 }
];
const latestDist = [
  { name: '0~40%',  value: 21 },
  { name: '40~60%', value: 18 },
  { name: '60~80%', value: 4  },
  { name: '80~100%',value: 2  }
];

/* ---------------- 指标数据 ---------------- */
const stats = {
  totalAssignments: mockAssignments.length,
  avgSubmission   : Math.round(mockSubmission.reduce((a,b)=>a+b)/mockSubmission.length),
  totalStudents   : 120,
  latestSuspectRate: (latestDist.slice(2).reduce((s,i)=>s+i.value,0)/61*100).toFixed(1)+'%'
};

const metrics = [
  { title: '总作业数',   value: stats.totalAssignments,   icon: ClipboardList },
  { title: '平均提交数', value: stats.avgSubmission,     icon: FileText },
  { title: '学生总数',   value: stats.totalStudents,     icon: Users },
  { title: '近期可疑率', value: stats.latestSuspectRate, icon: AlertTriangle }
];

/* ---------------- eCharts 配置 ---------------- */
const barOption = {
  tooltip:{ trigger:'axis' },
  xAxis:{ type:'category', data: mockAssignments },
  yAxis:{ type:'value' },
  series:[{ type:'bar', data: mockSubmission, barWidth:'45%' }]
};

const lineOption = {
  tooltip:{ trigger:'axis' },
  xAxis:{ type:'category', data: mockAssignments },
  yAxis:{ type:'value', min:0, max:100 },
  series:[{ type:'line', areaStyle:{}, data: mockAvgSim.map(v=> (v*100).toFixed(1)) }]
};

const radarOption = {
  tooltip:{},
  radar:{ indicator: simRadar.map(i=>({ name:i.name, max:1 })), radius:90 },
  series:[{ type:'radar', data:[ simRadar.map(i=>i.value) ] }]
};

const pieOption = {
  tooltip:{ trigger:'item' },
  series:[{ type:'pie', radius:['30%','70%'], label:{ formatter:'{b}: {d}%' }, data: latestDist }]
};

/* ---------------- 发布作业表单 ---------------- */
const store = useStore();
const assignment = ref({ title:'', description:'' });

const publishAssignment = async () => {
  try {
    await axios.post('/api/assignments',
        { ...assignment.value, teacherId: store.state.currentUser.id },
        { headers:{ Authorization:`Bearer ${store.state.currentUser?.token}` } }
    );
    assignment.value = { title:'', description:'' };
    alert('作业已发布');
  } catch {
    alert('发布失败');
  }
};
</script>

<style scoped></style>
