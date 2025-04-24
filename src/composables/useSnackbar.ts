// src/composables/useSnackbar.ts
import type { Ref } from 'vue';
import { ref } from 'vue';

// Type for snackbar colors
type SnackbarColor = 'success' | 'info' | 'warning' | 'error' | string;

// Create a global state for the snackbar
const snackbar: Ref<boolean> = ref(false);
const snackbarText: Ref<string> = ref('');
const snackbarColor: Ref<string> = ref('');
const timeout: Ref<number> = ref(3000);

export function useSnackbar() {
  // Show snackbar with message and optional color
  function showSnackbar(text: string, color: SnackbarColor = 'info', duration: number = 3000): void {
    snackbarText.value = text;
    snackbarColor.value = color;
    timeout.value = duration;
    snackbar.value = true;
  }
  
  // Close the snackbar
  function closeSnackbar(): void {
    snackbar.value = false;
  }
  
  return {
    snackbar,
    snackbarText,
    snackbarColor,
    timeout,
    showSnackbar,
    closeSnackbar
  };
}