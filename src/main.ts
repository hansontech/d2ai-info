import "./assets/main.css";
import { createApp } from "vue";
import router from './router'; // Import the router
import App from "./App.vue";
import { Amplify } from "aws-amplify";
import pinia from '@/stores'
import outputs from "../amplify_outputs.json";

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createVuetify } from 'vuetify'
import 'vuetify/styles';  // Global CSS has to be imported
import '@mdi/font/css/materialdesignicons.css'

import Sidebar from '@/components/SideBar.vue'
import AuthenticatedLayout from '@/layouts/AuthenticatedLayout.vue'
// import GuestLayout from '@/layouts/GuestLayout.vue'


Amplify.configure(outputs);

const vuetify = createVuetify({ 
    components, 
    directives 
})

const app = createApp(App)
// Register your component globally here
app.component('Sidebar', Sidebar)
app.component('AuthenticatedLayout', AuthenticatedLayout);
// app.component('GuestLayout', GuestLayout);

// mount everything
app.use(router)
app.use(vuetify)
app.use(pinia)
app.mount('#app')
