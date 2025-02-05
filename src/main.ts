import "./assets/main.css";
import { createApp } from "vue";
import router from './router'; // Import the router
import App from "./App.vue";
import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { createVuetify } from 'vuetify'
import 'vuetify/styles';  // Global CSS has to be imported

Amplify.configure(outputs);

const vuetify = createVuetify({ 
    components, 
    directives 
})

createApp(App).use(router).use(vuetify).mount("#app")
