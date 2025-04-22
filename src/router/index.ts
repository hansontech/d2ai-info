// src/router/index.ts
import { createRouter, createWebHistory} from 'vue-router';
import type { Router } from 'vue-router';
import routes from './routes';
import { useAuthStore } from '../stores'
// Create and configure the router
const router : Router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const requiresAuth = to.meta.requiresAuth;
  const authStore = useAuthStore()

  if (requiresAuth && authStore.isLoggedIn === false) {
    next('/login');
  } else {
    next();
  }
})

// Export the router instance
export default router;