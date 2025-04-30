<template>
  <form @submit.prevent="handleSubmit" class="space-y-6 max-w-xl">
    <div>
      <label for="title" class="block text-sm font-medium mb-1">作业标题</label>
      <input id="title" v-model="assignment.title" required placeholder="请输入标题"
             class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
    </div>

    <div>
      <label for="description" class="block text-sm font-medium mb-1">作业描述</label>
      <textarea id="description" v-model="assignment.description" required rows="4" placeholder="请输入描述"
                class="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-400" />
    </div>

    <button type="submit" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow active:scale-95">提交</button>
  </form>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
const emit = defineEmits(['submitAssignment']);
const assignment = ref({ title: '', description: '' });
const handleSubmit = () => {
  emit('submitAssignment', { ...assignment.value });
  assignment.value.title = '';
  assignment.value.description = '';
};
</script>
