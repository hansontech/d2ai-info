// src/router/index.ts
import { createRouter, createWebHistory} from 'vue-router';
import type { Router } from 'vue-router';
import routes from './routes';

// Create and configure the router
const router : Router = createRouter({
  history: createWebHistory(),
  routes,
});

// Export the router instance
export default router;