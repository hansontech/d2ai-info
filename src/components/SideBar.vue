<script setup lang="ts">
import { useAuthStore } from '../stores'
import { ref, onMounted, inject } from 'vue'

const navItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/user/dashboard' },
  { title: 'Data', icon: 'mdi-database', to: '/user/data' },
  { title: 'Training', icon: 'mdi-compass', to: '/user/training' },
  { title: 'Tasks', icon: 'mdi-play', to: '/user/tasks' },
];


onMounted(async () => {
  const authStore = useAuthStore()
})
</script>

<template>
 <v-list nav>
    <v-list-item
      v-for="item in navItems"
      :key="item.title"
      :to="item.to">
      <v-list-item-title class="text-body-1">
        {{ item.title }}
      </v-list-item-title>
    </v-list-item>
  </v-list>
</template>
<script lang="ts">
  export default {
    name: 'Sidebar'
  };
</script>
