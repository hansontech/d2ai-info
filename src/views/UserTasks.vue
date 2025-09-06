<template>
  <v-container fluid class="pa-6">
    <v-card>
        <v-tabs v-model="activeTab">
            <v-tab value="0">Run Tasks</v-tab>
            <v-tab value="1">Setup Tasks</v-tab>
        </v-tabs>
        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="0">
                <v-row>
                    <!-- Run Docker Image Section -->
                    <v-col>
                        <v-card elevation="2" class="pa-4">
                        <v-card-title class="headline">
                            <v-icon left>mdi-play</v-icon>
                            Run Task Instance
                        </v-card-title>
                        <v-card-text>
                            <v-form ref="runForm" v-model="validRunForm">
                            <v-select
                                v-model="selectedImage"
                                :items="availableImages"
                                item-title="name"
                                item-value="uri"
                                label="Select Docker Image"
                                :loading="loadingImages"
                                :disabled="loadingImages"
                                return-object
                                density="comfortable"
                                variant="outlined"
                                :rules="[v => !!v || 'Image selection is required']"
                            >
                                <template v-slot:item="{ props, item }">
                                <v-list-item v-bind="props" :title="item.raw.name" :subtitle="formatDate(item.raw.createdAt)">
                                    <template v-slot:prepend>
                                    <v-icon>mdi-docker</v-icon>
                                    </template>
                                </v-list-item>
                                </template>
                            </v-select>

                            <v-text-field
                                v-model="runCommand"
                                label="Command (optional)"
                                placeholder="e.g., --env VAR=value"
                                variant="outlined"
                                density="comfortable"
                                class="mt-4"
                            ></v-text-field>

                            <v-textarea
                                v-model="runParameters"
                                label="Parameters (optional)"
                                placeholder="JSON format: { 'param1': 'value1' }"
                                variant="outlined"
                                density="comfortable"
                                rows="2"
                                auto-grow
                                class="mt-4"
                            ></v-textarea>

                            <v-btn
                                color="primary"
                                :loading="isRunning"
                                :disabled="!validRunForm || isRunning"
                                block
                                size="large"
                                class="mt-6"
                                @click="runDockerImage"
                            >
                                Run Container
                                <v-icon right>mdi-arrow-right</v-icon>
                            </v-btn>
                            </v-form>
                        </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>
            <v-window-item value="1">
                <!-- Docker Image Upload Section -->
                <v-row>
                    <v-col>
                        <v-card elevation="2" class="pa-4">
                            <v-card-title class="headline">
                                <v-icon left>mdi-upload</v-icon>
                                Upload Task Docker Image
                            </v-card-title>
                            <v-card-text>
                                <DockerUpload ref="dockerUpload" @upload-success="handleUploadSuccess" />
                            </v-card-text>
                        </v-card>
                    </v-col>
                </v-row>
            </v-window-item>
          </v-window>
        </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DockerUpload from '../components/DockerUpload.vue';


// Types
interface DockerImage {
  id: string;
  uri: string;
  name: string;
  size: number;
  createdAt: Date;
  tags: string[];
}

interface Execution {
  id: string;
  imageUri: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startTime: Date;
  endTime?: Date;
  logs: string;
  parameters?: Record<string, any>;
}

// Tab control
const activeTab = ref(0);
  

// Refs
const dockerUpload = ref<InstanceType<typeof DockerUpload> | null>(null);
const validRunForm = ref(false);
const loadingImages = ref(true);
const isRunning = ref(false);
const selectedImage = ref<DockerImage | null>(null);
const runCommand = ref('');
const runParameters = ref('');
const availableImages = ref<DockerImage[]>([]);
const currentExecution = ref<Execution | null>(null);

// Initialize
onMounted(async () => {
/* TODO
  if (authUser.value) {
    await fetchUserImages();
  }
    */
});

// Fetch user's available Docker images
const fetchUserImages = async () => {
  /* TODO
  try {
    loadingImages.value = true;
    const response = await get({
      apiName: 'dockerApi',
      path: `/images/${authUser.value?.userId}`
    }).response;

    const data = await response.body.json();
    availableImages.value = data.images.map((img: any) => ({
      ...img,
      createdAt: new Date(img.createdAt)
    }));
  } catch (error) {
    console.error('Failed to fetch images:', error);
  } finally {
    loadingImages.value = false;
  }
    */
};

// Handle successful upload from DockerUpload component
const handleUploadSuccess = (imageUri: string) => {
  console.log('New image uploaded:', imageUri);
  fetchUserImages();
  
  // Auto-select the newly uploaded image
  const newImage = availableImages.value.find(img => img.uri === imageUri);
  if (newImage) {
    selectedImage.value = newImage;
  }
};

// Execute Docker image
const runDockerImage = async () => {
/* TODO
  if (!selectedImage.value || !authUser.value) return;
*/
  try {
    /* TODO
    isRunning.value = true;
    currentExecution.value = {
      id: `exec-${Date.now()}`,
      imageUri: selectedImage.value.uri,
      status: 'PENDING',
      startTime: new Date(),
      logs: 'Initializing execution...\n'
    };
    */
    // Parse parameters if provided
    let parsedParams = {};
    if (runParameters.value) {
      try {
        parsedParams = JSON.parse(runParameters.value);
      } catch (e) {
        console.warn('Invalid parameters format, using empty object');
      }
    }

    // Simulate execution (replace with actual API call)
    setTimeout(() => {
      if (currentExecution.value) {
        currentExecution.value.status = 'RUNNING';
        currentExecution.value.logs += 'Starting container...\n';
        
        setTimeout(() => {
          if (currentExecution.value) {
            currentExecution.value.status = 'COMPLETED';
            currentExecution.value.endTime = new Date();
            currentExecution.value.logs += 'Container completed successfully!\n';
            currentExecution.value.logs += 'Results: { "output": "Hello from Docker!" }';
          }
        }, 3000);
      }
    }, 1000);

    // Actual API call would look like this:
    /*
    const response = await post({
      apiName: 'dockerApi',
      path: '/run',
      options: {
        body: {
          imageUri: selectedImage.value.uri,
          userId: authUser.value.userId,
          command: runCommand.value,
          parameters: parsedParams
        }
      }
    }).response;

    const execution = await response.body.json();
    currentExecution.value = execution;
    */
  } catch (error) {
    console.error('Execution failed:', error);
    if (currentExecution.value) {
      currentExecution.value.status = 'FAILED';
      currentExecution.value.logs += `\nERROR: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  } finally {
    isRunning.value = false;
  }
};

// Helper functions
const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'RUNNING': return 'primary';
    case 'PENDING': return 'warning';
    case 'FAILED': return 'error';
    default: return 'info';
  }
};
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.v-card:hover {
  transform: translateY(-5px);
}

.headline {
  border-bottom: 2px solid #1976d2;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
</style>