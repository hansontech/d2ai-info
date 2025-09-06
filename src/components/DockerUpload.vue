<template>
  <v-card class="mx-auto" max-width="500">
    <v-card-title class="headline">Upload Docker Image</v-card-title>
    
    <v-card-text>
      <v-file-input
        v-model="dockerFile"
        label="Select Docker .tar file"
        accept=".tar"
        :loading="isUploading"
        prepend-icon="mdi-docker"
        outlined
        show-size
      ></v-file-input>
    </v-card-text>
    
    <v-card-actions>
      <v-btn
        color="primary"
        :disabled="!dockerFile || isUploading"
        @click="uploadDockerImage"
        :loading="isUploading"
      >
        Process Image
      </v-btn>
    </v-card-actions>
    
    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">

// TODO import { useAuth } from '@/composables/useAuth';
import { uploadData } from 'aws-amplify/storage';
import { post } from 'aws-amplify/api';
import { useAuthStore } from '../stores'
import { ref, onMounted, onBeforeMount } from 'vue'
import { generateClient } from 'aws-amplify/api';
import type { Schema } from "../../amplify/data/resource"

let authUser = ref({
  userId: '',
  username: ''
})

onMounted(async () => {
  const authStore = useAuthStore()
  console.log(authStore)
  const user = authStore.userObject
  console.log(user)
  authUser.value = {
    userId: user.attributes.sub,
    username: user.username
  }

})

// Types
interface Snackbar {
  show: boolean;
  message: string;
  color: 'success' | 'error' | 'info';
}

// Composables
// TODO const { authUser } = useAuth();

// Refs
const dockerFile = ref<File | null>(null);
const isUploading = ref(false);
const snackbar = ref<Snackbar>({
  show: false,
  message: '',
  color: 'info'
});

// Methods
const showSnackbar = (message: string, color: Snackbar['color'] = 'info') => {
  snackbar.value = { show: true, message, color };
};

const uploadDockerImage = async () => {
  if (!dockerFile.value || !authUser.value) return;
  
  isUploading.value = true;
  
  try {
    // 1. Upload to S3
    const uploadResult = await uploadData({
      path: `uploads/${authUser.value.userId}/${Date.now()}-${dockerFile.value.name}`,
      data: dockerFile.value,
      options: {
        contentType: 'application/tar',
        metadata: {
          userId: authUser.value.userId,
          originalName: dockerFile.value.name
        }
      }
    }).result;

    const s3Key = uploadResult.path;
    showSnackbar('File uploaded successfully! Starting processing...', 'info');

    // 2. Trigger Lambda processing
    // Generate a client for the API
    const client = generateClient<Schema>();
    let resultDockerProcessing = await client.queries.dockerProcessing({
      s3key: s3Key,
    }, {
      authMode: 'userPool',
    })

    const data : object = JSON.parse(resultDockerProcessing.data as string);
    console.log('data type:', typeof data);
   
  } catch (error) {
    console.error('Upload error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    showSnackbar(message, 'error');
  } finally {
    isUploading.value = false;
  }
};
</script>

<script lang="ts">
  export default {
    name: 'DockerUpload'
  };
</script>