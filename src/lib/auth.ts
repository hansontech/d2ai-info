import { Hub } from 'aws-amplify/utils'
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores'

// const router = useRouter();

/* Reference document
https://docs.amplify.aws/vue/build-a-backend/auth/connect-your-frontend/listen-to-auth-events/
*/
export function listenToAuthEvents(): void {
  let authStore = useAuthStore()
  Hub.listen('auth', ({ payload }) => {
    switch (payload.event) {
      case 'signedIn':
        authStore.setUser(payload.data)
        // router.push('/dashboard'); // Redirect to the desired page
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
