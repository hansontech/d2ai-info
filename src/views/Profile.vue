<script setup lang="ts">
import { useAuthStore } from '@/stores'
import { ref, onMounted, onBeforeMount } from 'vue'

let userName = ref('')

onMounted(async () => {
  const authStore = useAuthStore()
  console.log(authStore)
  const user = authStore.userObject
  console.log(user)
  userName.value = user.username
  console.log('username: ', userName)
})

</script>

<template>
    <v-container>
      <h1>Account Information</h1>
      <h2>User name is {{ userName }} </h2>
    </v-container>
</template>