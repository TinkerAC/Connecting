<!-- frontend/src/views/AdminDashboard.vue -->
<template>
  <Panel>
    <template #content>
      <h2>Admin Dashboard</h2>
      <div>
        <h3>User Management</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.id }}</td>
            <td>{{ user.username }}</td>
            <td>{{ user.role }}</td>
            <td>
              <button @click="editUser(user)">Edit</button>
              <button @click="deleteUser(user.id)">Delete</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
      <div style="margin-top:20px;">
        <h3>Assignment Management</h3>
        <table border="1" cellspacing="0" cellpadding="5">
          <thead>
          <tr>
            <th>ID</th>
            <th>Title</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="assignment in assignments" :key="assignment.id">
            <td>{{ assignment.id }}</td>
            <td>{{ assignment.title }}</td>
            <td>{{ assignment.description }}</td>
            <td>
              <button @click="editAssignment(assignment)">Edit</button>
              <button @click="deleteAssignment(assignment.id)">Delete</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>
  </Panel>
</template>

<script lang="ts">
import { ref, onMounted, computed } from 'vue';
import Panel from '@/components/Layout/Panel.vue';
import axios from 'axios';
import { useStore } from 'vuex';

export default {
  name: 'AdminDashboard',
  components: { Panel },
  setup() {
    const store = useStore();
    // 通过 computed 获取当前 token
    const token = computed(() => store.state.currentUser?.token);
    const users = ref([]);
    const assignments = ref([]);

    // 带上 token 的请求配置
    const getAuthConfig = () => ({
      headers: { Authorization: `Bearer ${token.value}` }
    });

    const loadUsers = async () => {
      try {
        const response = await axios.get('/api/users', getAuthConfig());
        // 假设后端返回的数据为响应体 data
        users.value = response.data.data || response.data;
      } catch (error) {
        console.error('Failed to load users:', error);
        alert('Failed to load users');
      }
    };

    const loadAssignments = async () => {
      try {
        const response = await axios.get('/api/assignments', getAuthConfig());
        assignments.value = response.data.data || response.data;
      } catch (error) {
        console.error('Failed to load assignments:', error);
        alert('Failed to load assignments');
      }
    };

    const editUser = (user: any) => {
      alert(`Edit user: ${user.username}`);
      // 编辑逻辑待实现
    };

    const deleteUser = async (id: number) => {
      try {
        await axios.delete(`/api/users/${id}`, getAuthConfig());
        alert('User deleted successfully');
        await await loadUsers();
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('Failed to delete user');
      }
    };

    const editAssignment = (assignment: any) => {
      alert(`Edit assignment: ${assignment.title}`);
      // 编辑逻辑待实现
    };

    const deleteAssignment = async (id: number) => {
      try {
        await axios.delete(`/api/assignments/${id}`, getAuthConfig());
        alert('Assignment deleted successfully');
        await loadAssignments();
      } catch (error) {
        console.error('Failed to delete assignment:', error);
        alert('Failed to delete assignment');
      }
    };

    onMounted(() => {
      loadUsers();
      loadAssignments();
    });

    return { users, assignments, editUser, deleteUser, editAssignment, deleteAssignment };
  }
};
</script>