<!-- ========= 1B. frontend/src/views/student/StudentCourseDetail.vue ========= -->
<template>
  <Panel>
    <template #content>
      <!-- 课程信息 -->
      <section v-if="course" class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow mb-8">
        <h2 class="text-2xl font-semibold mb-2">{{ course.title }}</h2>
        <p class="text-gray-600 dark:text-gray-300">{{ course.description }}</p>
      </section>
      <p v-else class="text-gray-500">正在加载课程信息…</p>

      <!-- 作业列表 -->
      <section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
        <h3 class="text-lg font-medium mb-4">作业</h3>
        <ul v-if="assignments.length" class="space-y-4">
          <li v-for="a in assignments" :key="a.id"
              class="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg flex flex-col gap-2">
            <div class="flex justify-between items-start">
              <div>
                <span class="font-medium">{{ a.title }}</span>
                <p class="text-sm text-gray-600 dark:text-gray-400">{{ a.description }}</p>
              </div>
              <span class="text-xs"
                    :class="a.submitted ? 'text-green-600' : 'text-red-500'">{{ a.submitted ? '已提交' : '未提交' }}</span>
            </div>

            <!-- 提交区域 -->
            <div v-if="!a.submitted">
              <div v-if="selectedAssignmentId !== a.id">
                <button @click="selectFile(a.id)"
                        class="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">选择文件</button>
              </div>
              <div v-else>
                <p class="text-sm mb-2">已选文件：{{ selectedFile?.name }}</p>
                <div class="flex gap-2">
                  <button @click="submitAssignment(a.id)"
                          class="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-white">提交</button>
                  <button @click="cancelSelection"
                          class="text-xs px-3 py-1 rounded bg-gray-400 hover:bg-gray-500 text-white">取消</button>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <p v-else class="text-gray-500">暂无作业</p>
      </section>

      <!-- 隐藏文件选择 -->
      <input ref="fileInput" type="file" class="hidden" @change="handleFileChange" />
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from '@fsrc/components/Layout/Panel.vue';

const route = useRoute();
const store = useStore();
const courseId = Number(route.params.id);

const course = ref<any>(null);
const assignments = ref<any[]>([]);
const selectedAssignmentId = ref<number | null>(null);
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const auth = () => ({ headers: { Authorization: `Bearer ${store.state.currentUser?.token}` } });

const loadCourse = async () => {
  try {
    const res = await axios.get(`/api/courses/${courseId}`, auth());
    const v = res.data?.data.assignments ||[];
    console.log("课程"+v);
    course.value = await res.data?.course ?? res.data;  // 兼容两种格式
  } catch {}
};

const loadAssignments = async () => {
  try {
    const res = await axios.get(`/api/courses/${courseId}/assignments`, auth());
    const v = res.data?.data.assignments ||[];
    console.log("作业"+v);
    assignments.value = await res.data?.data.assignments ||[];
  } catch {
    alert('加载作业失败');
  }
};


const selectFile = (aid: number) => {
  selectedAssignmentId.value = aid;
  fileInput.value!.value = '';
  fileInput.value!.click();
};
const handleFileChange = (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files[0]) selectedFile.value = files[0];
};
const submitAssignment = async (aid: number) => {
  if (!selectedFile.value) return alert('请选择文件');
  const fd = new FormData();
  fd.append('file', selectedFile.value);
  fd.append('courseId', String(courseId));
  try {
    await axios.post(`/api/assignments/${aid}/submit`, fd, {
      headers: { ...auth().headers, 'Content-Type': 'multipart/form-data' }
    });
    alert('提交成功');
    selectedAssignmentId.value = null;
    selectedFile.value = null;
    await loadAssignments();
  } catch { alert('提交失败'); }
};
const cancelSelection = () => { selectedAssignmentId.value = null; selectedFile.value = null; };

onMounted(() => { loadCourse(); loadAssignments(); });
</script>
