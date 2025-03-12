<!-- frontend/src/views/StudentCourse.vue -->
<template>
  <Panel>
    <template #content>
      <h2>My Courses (Student)</h2>
      <!-- 加入课程区域 -->
      <div class="join-course">
        <label for="joinCourseId">输入课程ID加入课程：</label>
        <input type="number" id="joinCourseId" v-model.number="joinCourseId" />
        <button @click="joinCourse">加入课程</button>
      </div>

      <!-- 已加入课程列表 -->
      <div v-if="courses.length">
        <ul>
          <li v-for="course in courses" :key="course.id">
            <strong>{{ course.title }}</strong>
            <p>{{ course.description }}</p>
            <!-- 点击后进入课程详情页面 -->
            <button @click="goToCourse(course.id)">查看课程详情</button>
          </li>
        </ul>
      </div>
      <div v-else>
        <p>尚未加入任何课程，请输入课程ID加入课程。</p>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import axios from 'axios';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'StudentCourse',
  components: { Panel },
  setup() {
    const courses = ref([]);
    const joinCourseId = ref<number | null>(null);
    const router = useRouter();
    const store = useStore();

    // 获取token并构造请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    // 加载当前学生已报名的课程
    const loadCourses = async () => {
      try {
        const response = await axios.get('/api/enrollments', getAuthConfig());
        // 假设后端返回的数据结构为 { success, message, data: { enrollments: [...] } }
        const enrollments = response.data.data.enrollments || [];
        courses.value = enrollments.map((enrollment: any) => enrollment.course);
      } catch (error) {
        console.error('Failed to load courses:', error);
        alert('加载课程失败');
      }
    };

    // 通过输入的课程ID加入课程
    const joinCourse = async () => {
      if (!joinCourseId.value) {
        alert('请输入课程ID');
        return;
      }
      try {
        await axios.post('/api/enrollments', { courseId: joinCourseId.value }, getAuthConfig());
        alert('加入课程成功');
        joinCourseId.value = null;
        await loadCourses();
      } catch (error: any) {
        console.error('Failed to join course:', error);
        alert('加入课程失败：' + (error.response?.data?.error || '未知错误'));
      }
    };

    // 点击课程跳转到课程详情页面
    const goToCourse = (courseId: number) => {
      router.push(`/student/course/${courseId}`);
    };

    onMounted(() => {
      loadCourses();
    });

    return { courses, joinCourseId, joinCourse, goToCourse };
  }
};
</script>

<style scoped>
.join-course {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}
.join-course label {
  margin-right: 10px;
}
.join-course input {
  width: 100px;
  margin-right: 10px;
}
</style>