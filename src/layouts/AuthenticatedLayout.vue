
<script setup lang="ts">
import type { Ref, ComputedRef } from 'vue';
import { ref, onMounted, inject, defineEmits } from 'vue'
import Sidebar from '../components/SideBar.vue'

</script>

<template>
  <v-main>
    <v-container fluid>
      <router-view />
    </v-container>
  </v-main>
</template>

<script lang="ts">

export default {
  name: 'AuthenticatedLayout'
};
</script>

<style scoped>
.layout {
  display: flex;
}
.content {
  flex: 1;
  padding: 1rem;
}

</style>