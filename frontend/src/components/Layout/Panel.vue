<!-- frontend/src/components/Layout/Panel.vue -->
<template>
  <div class="panel-layout">
    <TopBar />
    <div class="main-container">
      <SideMenu />
      <div class="content">
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import TopBar from './TopBar.vue';
import SideMenu from './SideMenu.vue';

export default {
  name: 'Panel',
  components: { TopBar, SideMenu }
};
</script>

<style scoped>
.panel-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.main-container {
  display: flex;
  flex: 1;
}
.content {
  flex: 1;
  padding: 20px;
}
</style>