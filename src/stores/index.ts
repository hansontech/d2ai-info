// stores/index.ts
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Reference: https://prazdevs.github.io/pinia-plugin-persistedstate/guide/why.html

// 1. Initialize Pinia
const pinia = createPinia()
// 2. Add plugins (e.g., persistence)
pinia.use(piniaPluginPersistedstate)
// 3. Export configured Pinia instance
export default pinia

// Export individual stores for direct access
export * from './auth'
