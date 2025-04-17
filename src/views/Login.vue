<script setup lang="ts">
  import { Authenticator } from "@aws-amplify/ui-vue";
  import "@aws-amplify/ui-vue/styles.css";

</script>

<template>
    <authenticator socialProviders="{['google']}" class="mt-10">
      <template v-slot="{ user, signOut }">
        <h1>Hello {{ user.username }}!</h1>
        <button @click="signOut">Sign Out</button>
      </template>
    </authenticator>
</template>

<script lang="ts">
  export default {
    name: 'Login'
  };
</script>
