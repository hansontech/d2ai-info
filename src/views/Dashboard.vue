<template>
  <v-container fluid>
    <v-row class="mt-4">
      <v-col cols="12">
        <h3>Instances</h3>
      </v-col>
    </v-row>
    <v-row class="controls">
         <v-col cols="8" sm="8" md="8">
          <v-select
            id="instance-status-select"
            v-model="selectedInstanceQueryStates"
            label="Instance Status"
            :items="[ 'running', 'stopped', 'pending', 'stopping', 'terminated']"
            @update:model-value="fetchInstances"
            variant="outlined"
            density="compact"
            hide-details
            multiple
          ></v-select>
        </v-col>
        
        <v-col cols="4" sm="4" md="4">
          <v-select
            id="time-range"
            v-model="timeRangeHours"
            label="Time Range"
            :items="[
              { value: 1, title: '1 hours' },
              { value: 12, title: '12 hours' },
              { value: 24, title: '1 day' },
              { value: 72, title: '3 days' },
              { value: 168, title: '7 days' }
            ]"
            item-value="value"
            item-title="title"
            @update:model-value="fetchInstances"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-col>
    </v-row>  
    <v-row>
      <v-col cols="12">
        <div class="instance-grid">
          <InstanceCard 
            v-for="instance in instances" 
            :key="instance.instanceId" 
            :instance="instance" 
            @select="selectInstance" 
          />
        </div>
      </v-col>
    </v-row>
    <v-row v-if="selectedInstance" class="log-section">
      <v-col cols="12">
          <h2>Instance Logs</h2>
          <InstanceLogViewer 
            :instances="instances" 
            :initial-instance-id="selectedInstance" 
          />
      </v-col>
    </v-row>
    <v-row v-else class="log-placeholder">
      <v-col cols="12">
        <p>Select an instance from above list to view logs</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { get } from 'aws-amplify/api';
import InstanceCard from '../components/InstanceCard.vue';
import InstanceLogViewer from '../components/InstanceLogViewer.vue';
import type { EC2Instance } from '../types/ec2';
import type { Schema } from "../../amplify/data/resource"
import { generateClient } from 'aws-amplify/api';

// State
const instances = ref<EC2Instance[]>([]);
const selectedInstance = ref<string | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const selectedInstanceQueryStates = ref(['running', 'stopped']);
const timeRangeHours = ref(24); // Default to 24 hours

// Fetch EC2 instances
const fetchInstances = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    // Generate a client for the API
    const client = generateClient<Schema>();

    console.log('time range hours: ', timeRangeHours.value)

    // API call for verification
    let result = await client.queries.queryInstances({
      queryInstanceStates: selectedInstanceQueryStates.value,
      timeRangeHours: timeRangeHours.value,
    }, {
      authMode: 'userPool',
    })
    
    const data : object = JSON.parse(result.data as string);
    console.log('data type:', typeof data);
    if (data && typeof data === 'object' && 'instances' in data) {
      // If the response contains instances, use them
      console.log('Fetched instances:', data.instances);
      let instancesData: [] = data.instances as []; //Record<string, any>[]
      instances.value = instancesData.map((item: any) => ({
        ...item,
        launchTime: new Date(item.launchTime),
        updatedAt: new Date(item.updatedAt),
      }));
    } else {
      console.log('No instances found in response:', data);
    }
  } catch (err) {
    console.error('Failed to fetch instances:', err);
    error.value = 'Failed to load instance data';
  } finally {
    loading.value = false;
  }
};

// Instance selection handler
const selectInstance = (instanceId: string) => {
  selectedInstance.value = instanceId;
};

// Get display name for instance
const getInstanceName = (id: string) => {
  const instance = instances.value.find(i => i.instanceId === id);
  return instance ? `${instance.imageId} (${id})` : id;
};

// Initialize
onMounted(() => {
  console.log('Dashboard mounted');
  fetchInstances();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.instance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.log-section {
  margin-top: 30px;
  border-top: 1px solid #e1e1e1;
  padding-top: 20px;
}

.log-placeholder {
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f8f9fa;
  border-radius: 8px;
  margin-top: 30px;
}
</style>