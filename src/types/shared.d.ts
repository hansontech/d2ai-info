import type { Ref, ComputedRef } from 'vue';

declare module '@vue/runtime-core' {
  interface InjectionKey {
    state: {
      drawer: Ref<boolean>;
      isMobile: ComputedRef<boolean>;
    };
  }
}