<!-- frontend/src/views/AdminCourseManagement.vue -->
<template>
  <Panel>
    <template #content>
      <h2>课程管理 (仅限管理员)</h2>

      <!-- 新建课程表单 -->
      <form @submit.prevent="createCourse">
        <div>
          <label for="title">课程标题：</label>
          <input type="text" id="title" v-model="title" required />
        </div>
        <div>
          <label for="description">课程描述：</label>
          <textarea id="description" v-model="description" required></textarea>
        </div>
        <div>
          <label for="teacherId">绑定教师ID：</label>
          <input type="number" id="teacherId" v-model.number="teacherId" required />
        </div>
        <button type="submit">新增课程</button>
      </form>

      <!-- 课程列表 -->
      <div style="margin-top:20px;">
        <h3>所有课程</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <thead>
          <tr>
            <th>ID</th>
            <th>课程标题</th>
            <th>课程描述</th>
            <th>教师ID</th>
            <th>操作</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="course in courses" :key="course.id">
            <td>{{ course.id }}</td>
            <td>{{ course.title }}</td>
            <td>{{ course.description }}</td>
            <td>{{ course.teacherId }}</td>
            <td>
              <button @click="editCourse(course)">编辑</button>
              <button @click="deleteCourse(course.id)">删除</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts">
import { ref, onMounted } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'AdminCourseManagement',
  components: { Panel },
  setup() {
    const store = useStore();
    const title = ref('');
    const description = ref('');
    const teacherId = ref<number | null>(null);
    const courses = ref([]);

    // 构造请求时的认证配置
    const getAuthConfig = () => {
      const token = store.state.currentUser?.token;
      return { headers: { Authorization: `Bearer ${token}` } };
    };

    const loadCourses = async () => {
      try {
        const response = await axios.get('/api/courses', getAuthConfig());
        // 假设后端返回的数据格式为 { success, message, data: { courses: [...] } } 或直接 courses 数组
        courses.value = response.data.data.courses || response.data.data || [];
      } catch (error) {
        console.error('加载课程失败:', error);
        alert('加载课程失败');
      }
    };

    const createCourse = async () => {
      if (!title.value || !description.value || teacherId.value === null) {
        alert('请填写所有字段');
        return;
      }
      try {
        await axios.post(
            '/api/courses',
            {
              title: title.value,
              description: description.value,
              teacherId: teacherId.value
            },
            getAuthConfig()
        );
        alert('课程创建成功');
        // 重置表单
        title.value = '';
        description.value = '';
        teacherId.value = null;
        // 重新加载课程列表
        loadCourses();
      } catch (error: any) {
        console.error('创建课程失败:', error);
        alert('创建课程失败：' + (error.response?.data?.error || '未知错误'));
      }
    };

    const editCourse = (course: any) => {
      alert(`编辑课程: ${course.title}`);
      // 编辑逻辑待实现
    };

    const deleteCourse = async (id: number) => {
      try {
        await axios.delete(`/api/courses/${id}`, getAuthConfig());
        alert('课程删除成功');
        loadCourses();
      } catch (error) {
        console.error('删除课程失败:', error);
        alert('删除课程失败');
      }
    };

    onMounted(() => {
      loadCourses();
    });

    return { title, description, teacherId, courses, createCourse, editCourse, deleteCourse };
  }
};
</script>

<style scoped>
form {
  max-width: 500px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
}
form div {
  margin-bottom: 15px;
}
form label {
  display: inline-block;
  width: 120px;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}
table th,
table td {
  padding: 8px;
  text-align: left;
}
</style>