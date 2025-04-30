<!-- ========= 1A. frontend/src/views/admin/AdminDashboard.vue ========= -->
<template>
  <Panel>
    <template #content>
      <h2 class="text-2xl font-semibold mb-6">管理员后台 · 用户管理</h2>

      <section class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow">
        <div class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            <tr>
              <th class="px-3 py-2">ID</th>
              <th class="px-3 py-2">姓名</th>
              <th class="px-3 py-2">角色</th>
              <th class="px-3 py-2">操作</th>
            </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="u in users" :key="u.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
              <td class="px-3 py-2">{{ u.id }}</td>
              <td class="px-3 py-2">{{ u.name }}</td>
              <td class="px-3 py-2 capitalize">{{ u.role }}</td>
              <td class="px-3 py-2 space-x-2">
                <button @click="editUser(u)"
                        class="text-xs px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white">编辑</button>
                <button @click="deleteUser(u.id)"
                        class="text-xs px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white">删除</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
        <p v-if="!users.length" class="text-gray-500 text-sm mt-4">暂无用户</p>
      </section>
    </template>
  </Panel>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import Panel from '@/components/Layout/Panel.vue';

const store = useStore();
const token = computed(() => store.state.currentUser?.token);
const users = ref<any[]>([]);

const auth = () => ({ headers: { Authorization: `Bearer ${token.value}` } });

const loadUsers = async () => {
  try {
    const { data } = await axios.get('/api/users', auth());
    users.value = data.data || data;
  } catch { alert('加载用户失败'); }
};

const editUser = (u: any) => alert(`准备编辑：${u.name}`);
const deleteUser = async (id: number) => {
  if (!confirm('确定删除该用户？')) return;
  try { await axios.delete(`/api/users/${id}`, auth()); await loadUsers(); }
  catch { alert('删除失败'); }
};

onMounted(loadUsers);
</script>
