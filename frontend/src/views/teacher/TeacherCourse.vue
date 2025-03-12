<!-- frontend/src/views/TeacherCourse.vue -->
<template>
  <Panel>
    <template #content>
      <h2>My Courses (Teacher)</h2>
      <div v-if="courses.length">
        <ul>
          <li v-for="course in courses" :key="course.id" class="course-item">
            <!-- 点击整个列表项跳转 -->
            <router-link :to="`/teacher/course/${course.id}`">
              <strong>{{ course.title }}</strong>
              <p>{{ course.description }}</p>
            </router-link>
          </li>
        </ul>
      </div>

    </template>
  </Panel>
</template>

<script lang="ts">
import {onMounted, ref} from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import axios from 'axios';
import {useRouter} from 'vue-router';
import {useStore} from 'vuex';

export default {
  name: 'TeacherCourse',
  components: {Panel},
  setup() {
    const courses = ref([]);
    const router = useRouter();
    const store = useStore();

    // 辅助函数：构造附带认证token的请求配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return {headers: {Authorization: `Bearer ${token}`}};
    };

    // 加载当前教师教授的课程（通过 teacherId 查询）
    const loadCourses = async () => {
      try {
        const teacherId = store.state.currentUser.id;
        console.log(store.state.currentUser);
        console.log("current teacher id: ", teacherId);
        const response = await axios.get('/api/courses', {
          params: {teacherId},
          ...getAuthConfig()
        });
        // 根据后端返回数据结构调整，这里假设返回 data.courses 或 data 本身就是数组
        courses.value = response.data.data?.courses || response.data.data || [];
      } catch (error) {
        console.error('Failed to load courses:', error);
        alert('Failed to load courses');
      }
    };


    onMounted(() => {
      loadCourses();
    });

    return {courses};
  }
};
</script>

<style scoped>
.course-item {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
}

.course-item a {
  text-decoration: none;
  color: inherit;
  display: block;
}
</style>