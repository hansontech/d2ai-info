<script setup lang="ts">
import { Hub } from 'aws-amplify/utils'
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores'
import { useDisplay } from 'vuetify'

// import { listenToAuthEvents } from '@/lib/auth'
import { ref, computed, watch, provide, onMounted, onBeforeUnmount } from 'vue'

const router = useRouter()

const route = useRoute()
const showSidebar = computed(() => route.meta.requiresAuth === true)

const { smAndDown, mdAndUp } = useDisplay() // or mdAndDown

function listenToAuthEvents(): void {
  let authStore = useAuthStore()
  Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signedIn':
        authStore.setUser(payload.data)
        router.push('/user/dashboard'); // Redirect to the desired page
        break;
      case 'signedOut':
        authStore.clearUser()
        break;
      case 'tokenRefresh':
        console.log('auth tokens have been refreshed.');
        break;
      case 'tokenRefresh_failure':
        console.log('failure while refreshing auth tokens.');
        break;
      case 'signInWithRedirect':
        console.log('signInWithRedirect API has successfully been resolved.');
        break;
      case 'signInWithRedirect_failure':
        console.log('failure while trying to resolve signInWithRedirect API.');
        break;
      case 'customOAuthState':
        break;
    }
  })
}


const windowWidth = ref(window.innerWidth);
const isMobile = computed(() => windowWidth.value < 960);
const drawer = ref(true); // Shared drawer state

const updateWidth = () => {
  windowWidth.value = window.innerWidth;
  if (isMobile.value) {
    drawer.value = false // Auto-hide on mobile
  } else {
    drawer.value = true // Auto-show on desktop
  }
};

let user = ref()
onMounted(async () => {
  listenToAuthEvents() // add listener to user auth events
  window.addEventListener('resize', updateWidth);
  user.value = useAuthStore().getLoggedIn
})

const authStore = useAuthStore()

// Toggle drawer visibility when login status changes
watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    drawer.value = isLoggedIn // Show if logged in, hide otherwise
  },
  { immediate: true } // Run on initial load
)

watch(() => route.path, () => {
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateWidth);
});

</script>

<template>
  <v-app>
    <!-- Persistent Navigation Bar -->
    <v-app-bar app color="primary" dark flat>
      <!-- Mobile Menu Button (Only shows when authenticated + mobile) -->
      <v-app-bar-nav-icon v-if="(user !== null && showSidebar) && isMobile" @click="drawer = !drawer" />
      <v-toolbar-title></v-toolbar-title>
      <v-btn to="/">
        <template v-if="smAndDown">
          <v-icon>mdi-home</v-icon>
        </template>
        <template v-else>
          Home
        </template>
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn to="/market-research">
        <template v-if="smAndDown">
          <v-icon>mdi-note-text</v-icon>
        </template>
        <template v-else>
          Market research
        </template>
      </v-btn>
      <v-btn to="/user/dashboard">
        <template v-if="smAndDown">
          <v-icon>mdi-animation</v-icon>
        </template>
        <template v-else>
          Data service
        </template>
      </v-btn>
      <v-btn to="/about">
        <template v-if="smAndDown">
          <v-icon>mdi-information-variant</v-icon>
        </template>
        <template v-else>
          About
        </template>
      </v-btn>
      <v-btn to="/login" v-if="authStore.isLoggedIn"><v-icon>mdi-account-circle</v-icon></v-btn>
      <v-btn to="/login" v-if="authStore.isLoggedIn === false">
        <template v-if="smAndDown">
          <v-icon>mdi-account</v-icon>
        </template>
        <template v-else>
          Login
        </template>
      </v-btn>
      <!-- <v-btn to="/contact">Contact</v-btn> -->
    </v-app-bar>

    <!-- Page Content -->
    <v-main style="padding-top: 70px !important;">
        <router-view></router-view>
      <!-- Footer -->
      <v-footer app color="primary" height="48" dark>
        <span>© 2024 D2AI</span>
      </v-footer>
    </v-main>
    <v-navigation-drawer v-if="authStore.isLoggedIn && showSidebar"
      color="grey-lighten-4"
      width="140"
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      :scrim="false"
      app
    >
      <Sidebar />
    </v-navigation-drawer>
  </v-app>
</template>

<script lang="ts">
export default {
  name: 'App',
};
</script>

<style scoped>
/* Ensure proper spacing when sidebar is hidden */

/* Desktop: Add margin when sidebar is visible */
@media (min-width: 960px) {

}
</style>
