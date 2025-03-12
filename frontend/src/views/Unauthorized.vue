<!-- frontend/src/views/Unauthorized.vue -->
<template>
  <div class="unauthorized">
    <h2>Access Denied</h2>
    <p>You do not have permission to view this page.</p>
    <router-link to="/login">Go to Login</router-link>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Unauthorized'
};
</script>

<style scoped>
.unauthorized {
  text-align: center;
  margin-top: 50px;
}
</style>