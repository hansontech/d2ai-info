<template>
    <v-container class="log-viewer">
      <v-row class="controls mb-4" align="center">
        <!-- Instance Selection -->
        <v-col cols="12" sm="6" md="5" lg="4">
          <v-select
            id="instance-select"
            v-model="selectedInstanceId"
            label="Instance"
            :items="props.instances"
            item-value="instanceId"
            item-title="instanceId"
            @update:model-value="fetchLogs"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-server"
          />
        </v-col>
        
        <!-- Time Range Selection -->
        <v-col cols="12" sm="4" md="3" lg="3">
          <v-select
            id="time-range"
            v-model="timeRange"
            label="Time Range"
            :items="timeRangeOptions"
            item-value="value"
            item-title="title"
            @update:model-value="fetchLogs"
            variant="outlined"
            density="compact"
            hide-details
            prepend-inner-icon="mdi-clock-outline"
          />
        </v-col>
        
            <!-- Refresh Button -->
            <v-col cols="6" sm="3" md="3" lg="2" >
              <v-btn
                @click="fetchLogs"
                :disabled="loading"
                :loading="loading"
                variant="outlined"

                block
                size="default"
                class="refresh-btn"
              >
                <v-icon start>mdi-redo</v-icon>
                <span class="d-none d-sm-inline">Refresh</span>
              </v-btn>
            </v-col>
            
            <!-- Auto Refresh Toggle -->
            <v-col cols="2" sm="2" md="2" lg="2">
              <label class="auto-refresh">
                <input 
                  type="checkbox" 
                  v-model="autoRefreshEnabled" 
                  @change="toggleAutoRefresh"
                >
                <v-icon>mdi-refresh</v-icon> 
                <template v-if="mdAndUp">
                  (30s)
                </template>
              </label>
            </v-col>

      </v-row>

      <v-row class="log-container">
        <v-col cols="12">
          <!-- Loading State -->
          <v-row v-if="loading" class="loading-indicator justify-center align-center">
            <v-col cols="12" class="text-center">
              <v-progress-circular indeterminate color="primary" class="mb-3" />
              <p class="text-body-1">Loading logs...</p>
            </v-col>
          </v-row>
          
          <!-- Error State -->
          <v-row v-else-if="error" class="error-message justify-center align-center">
            <v-col cols="12" class="text-center">
              <v-icon color="error" size="large" class="mb-2">mdi-alert</v-icon>
              <p class="text-body-1 text-error">{{ error }}</p>
            </v-col>
          </v-row>
          
          <!-- Empty State -->
          <v-row v-else-if="logs.length === 0" class="empty-state justify-center">
            <v-col cols="12" class="text-center">
              <v-icon size="64" color="grey-lighten-1" class="mb-3">mdi-file-document-outline</v-icon>
              <p class="text-h6 text-grey-darken-1">No logs found for selected time range</p>
            </v-col>
          </v-row>
          
          <!-- Log Entries -->
          <div v-else class="log-entries">
            <!-- Header Row (Optional) -->
            <v-row class="log-header mb-2 d-none d-sm-flex">
              <v-col cols="12" sm="3" md="2" class="font-weight-bold text-caption">
                TIMESTAMP
              </v-col>
              <v-col cols="12" sm="9" md="10" class="font-weight-bold text-caption">
                MESSAGE
              </v-col>
            </v-row>
            
            <!-- Log Entry Rows -->
            <v-row 
              v-for="(log, index) in logs" 
              :key="log.eventId || `${log.timestamp}-${index}`" 
              class="log-entry mb-1"
              :class="{'log-error': isErrorLog(log.message)}"
              no-gutters
            >
              <!-- Timestamp Column -->
              <v-col cols="12" sm="3" md="2" class="timestamp-col">
                <v-chip
                  size="small"
                  variant="outlined"
                  class="timestamp-chip"
                  :color="isErrorLog(log.message) ? 'error' : 'primary'"
                >
                  {{ formatTimestamp(log.timestamp) }}
                </v-chip>
              </v-col>
              
              <!-- Message Column -->
              <v-col cols="12" sm="9" md="10" class="message-col">
                <div class="message-content">
                  <span 
                    class="message-text"
                    :class="{'text-error': isErrorLog(log.message)}"
                  >
                    {{ log.message }}
                  </span>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script setup lang="ts">
  import { ref, watch, onMounted, onUnmounted } from 'vue';
  import { get } from 'aws-amplify/api';
  import type { EC2Instance, CloudWatchLogEntry, LogViewerProps } from '../types/ec2';
  import type { Schema } from "../../amplify/data/resource"
  import { generateClient } from 'aws-amplify/api';
  import { useDisplay } from 'vuetify'
  import { run } from 'node:test';
  const { smAndDown, mdAndUp } = useDisplay() 
  const props = defineProps<LogViewerProps & { initialInstanceId?: string }>();
  
  // State
  const selectedInstanceId = ref(props.initialInstanceId || props.instances[0]?.instanceId || '');
  const timeRange = ref('15');
  const logs = ref<CloudWatchLogEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const autoRefreshEnabled = ref(false);
  const refreshInterval = ref<number | null>(null);
  
  // Time range options
  const timeRangeOptions = [
    { value: '5', title: '5 mins' },
    { value: '15', title: '15 mins' },
    { value: '60', title: '1 hour' },
    { value: '240', title: '4 hours' },
    { value: '1440', title: '24 hours' }
  ]
  // Format timestamp
  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };
  
  // Detect error logs (customize based on your log patterns)
  const isErrorLog = (message: string) => {
    return message.toLowerCase().includes('error') || 
           message.toLowerCase().includes('exception') || 
           message.toLowerCase().includes('fail');
  };
  
  // Fetch logs from CloudWatch via API
  const fetchLogs = async () => {
    if (!selectedInstanceId.value) return;
    
    // Generate a client for the API
    const client = generateClient<Schema>();

    loading.value = true;
    error.value = null;
    
    console.log('Fetching logs for instance:', selectedInstanceId.value, 'Time range:', timeRange.value);

    try {
      // API call for verification
      let result = await client.queries.getInstanceLogs({
        instanceId: selectedInstanceId.value,
        lastMinutes: `${parseInt(timeRange.value, 10)}`,
      }, {
        authMode: 'userPool',
      });
          
      // console.log('Fetched logs:', result.data);

      // Get the raw JSON data
      const rawData: object = JSON.parse(result.data as string);
    
      console.log('Row data type:', typeof rawData);
      // Validate and type cast the response
      if (rawData && typeof rawData === 'object' && 'events' in rawData && isValidLogData(rawData.events)) {
        console.log('logs total: ',rawData.events.length)
        logs.value = rawData.events;
      } else {
        throw new Error('Invalid log data format');
     }
    } catch (err) {
      console.error('Error fetching logs:', err);
      error.value = 'Failed to load logs. Please try again.';
    } finally {
      loading.value = false;
    }
  };
  // Add type validation function
function isValidLogData(data: unknown): data is CloudWatchLogEntry[] {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    return typeof item === 'object' && 
           item !== null &&
           typeof (item as CloudWatchLogEntry).message === 'string';
  });
 }
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefreshEnabled.value) {
      refreshInterval.value = window.setInterval(fetchLogs, 30000);
    } else if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
  };
  
  // Initialize
  onMounted(() => {
    if (selectedInstanceId.value) {
      fetchLogs();
    }
  });
  
  // Cleanup
  onUnmounted(() => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
    }
  });
  
  // Watch for instance changes
  watch(() => props.instances, (newInstances) => {
    if (newInstances.length > 0 && !selectedInstanceId.value) {
      selectedInstanceId.value = newInstances[0].instanceId;
      fetchLogs();
    }
  }, { immediate: true });
  
  // Watch for initial instance ID changes
  watch(() => props.initialInstanceId, (newId) => {
    if (newId) {
      selectedInstanceId.value = newId;
      fetchLogs();
    }
  });
  
  </script>
  
  <script lang="ts">
  export default {
    name: 'InstanceLogViewer',
  };
  </script>

  <style scoped>
  .log-viewer {
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fff;
  }
  
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    padding: 15px;
    background-color: #f8f9fa;
    border-bottom: 1px solid #e1e1e1;
  }
  
  .instance-selector,
  .time-range,
  .refresh-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  label {
    font-weight: 500;
    font-size: 0.9rem;
  }
  
  select {
    padding: 8px 12px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background-color: #fff;
  }
  
  button {
    padding: 8px 15px;
    background-color: #0d6efd;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  button:hover {
    background-color: #0b5ed7;
  }
  
  button:disabled {
    background-color: #6c757d;
    cursor: not-allowed;
  }
  
  .auto-refresh {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.9rem;
  }
  
  .log-container {
    height: 400px;
    overflow-y: auto;
    background-color: #1e1e1e;
    color: #d4d4d4;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }
  
  .log-entries {
    padding: 10px;
  }
  
  .log-entry {
    display: flex;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .timestamp {
    color: #6a9955;
    margin-right: 15px;
    flex-shrink: 0;
    min-width: 100px;
  }
  
  .message {
    white-space: pre-wrap;
    word-break: break-all;
    flex-grow: 1;
  }
  
  .log-error {
    color: #f44747;
    background-color: rgba(244, 71, 71, 0.1);
    padding: 2px 5px;
    border-radius: 3px;
  }
  
  .loading-indicator,
  .error-message,
  .empty-state {
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 20px;
    text-align: center;
    color: #6c757d;
  }
  </style>