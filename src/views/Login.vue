<script setup lang="ts">
  import { Authenticator } from "@aws-amplify/ui-vue";
  import "@aws-amplify/ui-vue/styles.css";
  import { useAuthStore } from '@/stores'
  import { ref, onMounted, onBeforeMount } from 'vue'
 
  onMounted(async () => {
    let authStore = useAuthStore()
  })
</script>

<template>
    <authenticator>
      <template v-slot="{ user, signOut }">
        <v-card class="mt-3">
          <v-card-title> Logged in as {{ user.signInDetails.loginId }}</v-card-title>
        </v-card>
        <v-btn color="secondary" class="mt-3" @click="signOut">Sign Out</v-btn>
      </template>
    </authenticator>
</template>

<script lang="ts">
  export default {
    name: 'Login'
  };
</script>
