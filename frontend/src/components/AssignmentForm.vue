<!-- frontend/src/components/AssignmentForm.vue -->
<template>
  <form @submit.prevent="handleSubmit">
    <div>
      <label for="title">作业标题：</label>
      <input type="text" id="title" v-model="assignment.title" required />
    </div>
    <div>
      <label for="description">作业描述：</label>
      <textarea id="description" v-model="assignment.description" required></textarea>
    </div>
    <button type="submit">提交</button>
  </form>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'AssignmentForm',
  emits: ['submitAssignment'],
  setup(_, { emit }) {
    const assignment = ref({
      title: '',
      description: ''
    });
    const handleSubmit = () => {
      emit('submitAssignment', assignment.value);
      assignment.value.title = '';
      assignment.value.description = '';
    };
    return { assignment, handleSubmit };
  }
});
</script>