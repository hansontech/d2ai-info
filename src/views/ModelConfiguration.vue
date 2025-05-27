<template>
    <v-container fluid>
      <v-card>
        <v-tabs v-model="activeTab">
            <v-tab value="0">Configure</v-tab>
            <v-tab value="1">Load Configuration</v-tab>
        </v-tabs>
        <v-card-text>
          <v-window v-model="activeTab">
            <v-window-item value="0">
                <v-card-title>Model Configuration</v-card-title>
                <!-- Configuration Form Header with Save Button -->
                <v-row  class="mb-4">
                  <v-col cols="8" sm="8" md="6">
                    <v-text-field 
                      v-model="currentConfig.modelName" 
                      label="Model Name" 
                      required
                      density="comfortable"
                      variant="outlined"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2" sm="2" md="3" class="text-right">
                    <v-btn 
                      color="primary" 
                      @click="saveConfig"
                      :loading="saving"
                      block
                    >
                      <v-icon start>mdi-content-save</v-icon>
                      <template v-if="mdAndUp">
                        Save
                      </template>
                    </v-btn>
                  </v-col>
                  <v-col cols="2" sm="2" md="3" class="text-right">
                    <v-btn 
                      color="primary" 
                      @click="runTraining"
                      :loading="training"
                      block
                    >
                      <v-icon start>mdi-grid</v-icon>
                      <template v-if="mdAndUp">
                        Training
                      </template>
                    </v-btn>
                  </v-col>
                </v-row>
            
                <v-row>
                    <v-col cols="12" md="6">
                    <v-text-field 
                        v-model.number="currentConfig.learningRate" 
                        label="Learning Rate" 
                        type="number" 
                        step="0.0001"
                    ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                    <v-text-field 
                        v-model.number="currentConfig.batchSize" 
                        label="Batch Size" 
                        type="number" 
                        min="1"
                    ></v-text-field>
                    </v-col>
                </v-row>
            
                <v-row>
                    <v-col cols="12" md="6">
                    <v-text-field 
                        v-model.number="currentConfig.epochs" 
                        label="Epochs" 
                        type="number" 
                        min="1"
                    ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                    <v-select
                        v-model="currentConfig.optimizer"
                        :items="['adam', 'sgd', 'rmsprop', 'adagrad']"
                        label="Optimizer"
                    ></v-select>
                    </v-col>
                </v-row>
            
                <v-row>
                    <v-col cols="12" md="6">
                    <v-slider
                        v-model.number="currentConfig.dropout"
                        label="Dropout Rate"
                        min="0"
                        max="0.5"
                        step="0.05"
                        thumb-label
                    ></v-slider>
                    </v-col>
                    <v-col cols="12" md="6">
                    <v-checkbox
                        v-model="currentConfig.useBatchNorm"
                        label="Use Batch Normalization"
                    ></v-checkbox>
                    </v-col>
                </v-row>
            
                <v-divider class="my-4"></v-divider>
            
                <v-card-title class="px-0">Network Layers</v-card-title>
                
                <v-table>
                    <thead>
                    <tr>
                        <th>Type</th>
                        <th>Units/Size</th>
                        <th>Activation</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="(layer, index) in currentConfig.layers" :key="index">
                        <td>
                        <v-select
                            v-model="layer.type"
                            :items="['dense', 'conv2d', 'lstm', 'dropout']"
                            dense
                            hide-details
                        ></v-select>
                        </td>
                        <td>
                        <v-text-field
                            v-model.number="layer.units"
                            type="number"
                            dense
                            hide-details
                            :disabled="layer.type === 'dropout'"
                        ></v-text-field>
                        </td>
                        <td>
                        <v-select
                            v-model="layer.activation"
                            :items="['relu', 'sigmoid', 'tanh', 'linear', 'softmax']"
                            dense
                            hide-details
                            :disabled="layer.type === 'dropout'"
                        ></v-select>
                        </td>
                        <td>
                        <v-btn
                            icon="mdi-delete"
                            variant="text"
                            color="error"
                            @click="removeLayer(index)"
                        ></v-btn>
                        </td>
                    </tr>
                    </tbody>
                </v-table>
            
                <v-btn 
                    @click="addLayer" 
                    color="primary" 
                    class="mt-4"
                >
                    Add Layer
                </v-btn>
            </v-window-item>
            <v-window-item value="1">
                <!-- Config Loader -->
                <v-card-title>Load Configuration</v-card-title>
                <v-text-field
                v-model="search"
                label="Search configurations"
                prepend-inner-icon="mdi-magnify"
                clearable
                class="mt-4"
                ></v-text-field>

                <v-table>
                <thead>
                    <tr>
                    <th>Name</th>
                    <th>Last Modified</th>
                    <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="item in filteredConfigs" :key="item.key">
                    <td>{{ item.name }}</td>
                    <td>{{ formatDate(item.lastModified) }}</td>
                    <td>
                        <v-btn
                        color="primary"
                        variant="text"
                        @click="loadConfig(item.key)"
                        :loading="loadingKeys.includes(item.key)"
                        >
                        Load
                        </v-btn>
                    </td>
                    </tr>
                </tbody>
                </v-table>

                <v-progress-linear
                v-if="loadingConfigs"
                indeterminate
                class="mt-4"
                ></v-progress-linear>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
     </v-container>
  </template>
    
<script setup lang="ts">
    import type { Schema } from "../../amplify/data/resource"
    import { ref, computed, watch, onMounted } from 'vue';
    import { useAuthStore } from '../stores'
    import { 
            uploadData, 
            downloadData, 
            list, 
            remove 
        } from 'aws-amplify/storage';
    import { generateClient } from 'aws-amplify/api';
    import { useDisplay } from 'vuetify'
import { run } from 'node:test';
    const { smAndDown, mdAndUp } = useDisplay() 

    // Get current user's S3 prefix
    const getUserPrefix =  (): string => {
        const user = useAuthStore().getUser()
        return `users/${user.username}`;
    };

    const client = generateClient<Schema>();

    // Configuration state
    const currentConfig = ref({
        modelName: '',
        learningRate: 0.001,
        batchSize: 32,
        epochs: 10,
        optimizer: 'adam',
        layers: [
        { type: 'dense', units: 128, activation: 'relu' }
        ],
        dropout: 0.2,
        useBatchNorm: true
    });

    // Tab control
    const activeTab = ref(0);
  

    /*
    defineProps({
      currentConfig: {
        type: Object,
        required: true
      },
      disabled: Boolean
    });
    */
    // const emit = defineEmits(['update:currentConfig']);
    
  
    // Config loader state
    interface S3File {
        key: string;
        name: string;
        size: number;
        lastModified: Date;
    }
    const search = ref('');
    const configs = ref<S3File[]>([]);
    const loadingConfigs = ref(false);
    const loadingKeys = ref<string[]>([]);
    
    // UI state
    const saving = ref(false);
    const training = ref(false);
    const snackbar = ref({
        show: false,
        message: '',
        color: 'success'
    });
  
    // Load saved configurations when the Load tab is accessed
    onMounted(async () => {
        // We'll load configs when the tab is activated instead
    });
    
    // Watch the active tab to load configs when needed
    watch(activeTab, async (newVal) => {
        if ((`${newVal}` === '1') && (configs.value.length === 0)) {
            await loadSavedConfigs();
        }
    });
  
    const loadSavedConfigs = async () => {
        loadingConfigs.value = true;
        try {
            const userPrefix = await getUserPrefix(); 
            const { items } = await list({ 
                path: `${userPrefix}/configs/`,
                options: {
                    pageSize: 100
                }
            });
            configs.value = items
                .filter(item => !item.path.endsWith('/')) // exclude folders  
                .map(item => { 
                  let name = (item.path.split('/').pop() || 'Unnamed').replace('.json', '');
                  return ({
                    key: item.path,
                    size: item.size || 0,
                    name: name,
                    lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
                  })
                 }  
                );
        } catch (error) {
            //-- showSnackbar('Error loading configurations', 'error');
            console.error(error);
        } finally {
            loadingConfigs.value = false;
        }
    };
  
  const filteredConfigs = computed(() => {
    if (!search.value) return configs.value;
    return configs.value.filter(item =>
      item.name.toLowerCase().includes(search.value.toLowerCase())
    );
  });

  const loadConfig = async (key:string) => {
    loadingKeys.value.push(key);
    try {
      const downloadResult = await downloadData({ path: key }).result;
      const text = await downloadResult.body.text();
      const config = JSON.parse(text)
      currentConfig.value = config;
      activeTab.value = 0; // Switch to configure tab
      //-- showSnackbar('Configuration loaded');
    } catch (error) {
      //-- showSnackbar('Error loading configuration', 'error');
      console.error(error);
    } finally {
      loadingKeys.value = loadingKeys.value.filter(k => k !== key);
    }
  };
  const runTraining = async () => {
    training.value = true;
    try {
      client.queries.sayHello({
        name: "Amplify",
      })
    } catch (error) {
      //-- showSnackbar('Error saving configuration', 'error');
      console.error(error);
    } finally {
      training.value = false;
    }
  }
  const saveConfig = async () => {
    saving.value = true;
    try {
        const key = `${getUserPrefix()}/configs/${currentConfig.value.modelName || 'unnamed'}.json`;
        const result = await uploadData({
                path: key,
                data: JSON.stringify(currentConfig.value),
            }).result;
        console.log('Succeeded: ', result);
      //-- showSnackbar('Configuration saved successfully!');
    } catch (error) {
      //-- showSnackbar('Error saving configuration', 'error');
      console.error(error);
    } finally {
      saving.value = false;
    }
  };
  
  // Layer management
  const addLayer = () => {
    currentConfig.value.layers.push(
      { type: 'dense', units: 64, activation: 'relu' }
    );
  };
  
  const removeLayer = (index: number) => {
    currentConfig.value.layers.splice(index, 1);
  };
  
  // Helper functions
  const formatDate = (date: Date) => {
    return date.toLocaleString();
  };
  
  const showSnackbar = (message: string, color = 'success') => {
    snackbar.value = { show: true, message, color };
  };
  
  // S3 operations (same as before)
  const files = ref<S3File[]>([]);

  // Fetch files from S3

  </script>
  <style scoped>
  /* Add any custom styles here */
  .v-table {
    margin-top: 16px;
    margin-bottom: 16px;
  }
  </style>