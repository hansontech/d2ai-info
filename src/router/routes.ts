import type { RouteRecordRaw } from 'vue-router';
import Home from '@/views/Home.vue';
import About from '@/views/About.vue';
import Contact from '@/views/Contact.vue';
import Login from '@/views/Login.vue';
import Profile from '@/views/Profile.vue';
import Dashboard from '@/views/Dashboard.vue';
import UserData from '@/views/UserData.vue'

import Todos from '@/components/Todos.vue';
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue'
import MarketResearch from '@/views/MarketResearch.vue';
import ModelConfiguration from '@/views/ModelConfiguration.vue';

// Define routes with proper type
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'Home', component: Home },
  { path: '/market-research', name: 'MarketResearch', component: MarketResearch },
  { path: '/about', name: 'About', component: About },
  { path: '/contact', name: 'Contact', component: Contact },
  { path: '/profile', name: 'Profile', component: Profile },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login',
      auth: false
    }
  },
  {
    path: '/user',
    component: AuthenticatedLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', component: Dashboard },
      { path: 'training', component: ModelConfiguration },
      { path: 'tasks', component: Todos },
      { path: 'data', component: UserData },
      // more user-specific pages
    ]
  },
  // { path: '*', component: NotFound }
];

export default routes;