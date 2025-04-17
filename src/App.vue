<script setup lang="ts">
</script>

<template>
  <v-app>
    <!-- Persistent Navigation Bar -->
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>AI Market Research</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn to="/">Home</v-btn>
      <v-btn to="/about">About</v-btn>
      <v-btn to="/login">Login</v-btn>
      <!-- <v-btn to="/contact">Contact</v-btn> -->
    </v-app-bar>

    <!-- Page Content -->
    <v-main class="bg-surface">
      <router-view></router-view>
    </v-main>

    <!-- Footer -->
    <v-footer app color="primary" dark>
      <v-col class="text-center white--text">© 2024 D2AI</v-col>
    </v-footer>
  </v-app>
</template>

<script lang="ts">
export default {
  name: 'App',
};
</script>

