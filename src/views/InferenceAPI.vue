<template>
  <v-container fluid class="pa-6">
    <v-card>
      <v-tabs v-model="activeTab">
        <v-tab value="0">Data to Inference API</v-tab>
        <v-tab value="1">API Documentation</v-tab>
        <v-tab value="2">Authentication Guide</v-tab>
      </v-tabs>
      
      <v-card-text>
        <v-window v-model="activeTab">
          <!-- File Upload & Inference Tab -->
          <v-window-item value="0">
            <v-row>
              <v-col>
                <v-card elevation="2" class="pa-4">
                  <v-card-title class="headline">
                    <v-icon left>mdi-cloud-upload</v-icon>
                    Upload Data File and Send to Inference API
                  </v-card-title>
                  <v-card-text>
                    <v-form ref="inferenceForm" v-model="validForm">
                      <!-- File Upload Section -->
                      <v-file-input
                        v-model="selectedFile"
                        label="Select data file"
                        accept=".json,.csv,.txt,.xml"
                        variant="outlined"
                        density="comfortable"
                        prepend-icon="mdi-file"
                        show-size
                        :rules="fileRules"
                        class="mb-4"
                      >
                        <template v-slot:selection="{ fileNames }">
                          <template v-for="fileName in fileNames" :key="fileName">
                            <v-chip color="primary" label size="small" class="me-2">
                              {{ fileName }}
                            </v-chip>
                          </template>
                        </template>
                      </v-file-input>

                      <!-- Additional Parameters -->
                      <v-textarea
                        v-model="additionalParams"
                        label="Additional Parameters (JSON format, optional)"
                        placeholder='{"param1": "value1", "param2": "value2"}'
                        variant="outlined"
                        density="comfortable"
                        rows="3"
                        auto-grow
                        class="mb-4"
                      ></v-textarea>

                      <!-- Action Buttons -->
                      <v-btn
                        color="primary"
                        :loading="isProcessing"
                        :disabled="!validForm || isProcessing"
                        block
                        size="large"
                        @click="processInference"
                      >
                        <v-icon left>mdi-brain</v-icon>
                        Run Inference
                      </v-btn>
                    </v-form>

                    <!-- Results Section -->
                    <v-card v-if="inferenceResult" class="mt-6" elevation="1">
                      <v-card-title class="text-h6">
                        <v-icon left :color="resultColor">{{ resultIcon }}</v-icon>
                        Inference Results
                      </v-card-title>
                      <v-card-text>
                        <v-alert
                          :type="inferenceResult.success ? 'success' : 'error'"
                          variant="tonal"
                          class="mb-4"
                        >
                          {{ inferenceResult.message }}
                        </v-alert>
                        
                        <v-code v-if="inferenceResult.data" class="result-code">
                          {{ JSON.stringify(inferenceResult.data, null, 2) }}
                        </v-code>
                      </v-card-text>
                    </v-card>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-window-item>

          <!-- API Documentation Tab -->
          <v-window-item value="1">
            <v-card elevation="2" class="pa-4">
              <v-card-title class="headline">
                <v-icon left>mdi-api</v-icon>
                Inference API Documentation
              </v-card-title>
              <v-card-text>
                <div class="api-docs">
                  <!-- Base URL -->
                  <h3 class="text-h6 mb-3">Base URL</h3>
                  <v-code class="mb-4">
                    {{ apiBaseUrl }}
                  </v-code>

                  <!-- Endpoints -->
                  <h3 class="text-h6 mb-3">Endpoints</h3>
                  
                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1 bg-primary">
                      <v-chip color="success" size="small" class="me-2">POST</v-chip>
                      /inference
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Run inference on uploaded data</p>
                      
                      <h4 class="text-subtitle-2 mb-2">Request Headers</h4>
                      <v-code class="mb-3">
                        <pre>
Content-Type: application/json
Authorization: Bearer {access_token}
                        </pre>
                      </v-code>

                      <h4 class="text-subtitle-2 mb-2">Request Body</h4>
                      <v-code class="mb-3">
{
  "data": "base64-encoded-file-content",
  "fileName": "data.json",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}
                      </v-code>

                      <h4 class="text-subtitle-2 mb-2">Response (200 OK)</h4>
                      <v-code class="mb-3">
{
  "success": true,
  "data": {
    "results": [...],
    "confidence": 0.95,
    "processingTime": "1.2s"
  },
  "message": "Inference completed successfully"
}
                      </v-code>

                      <h4 class="text-subtitle-2 mb-2">Error Response (400/500)</h4>
                      <v-code>
{
  "success": false,
  "error": "Error description",
  "code": "INVALID_INPUT"
}
                      </v-code>
                    </v-card-text>
                  </v-card>

                  <v-card variant="outlined" class="mb-4">
                    <v-card-title class="text-subtitle-1 bg-info">
                      <v-chip color="info" size="small" class="me-2">GET</v-chip>
                      /inference/status/{jobId}
                    </v-card-title>
                    <v-card-text>
                      <p class="mb-3">Check inference job status (for async processing)</p>
                      
                      <h4 class="text-subtitle-2 mb-2">Response</h4>
                      <v-code>
{
  "jobId": "job-123",
  "status": "completed|processing|failed",
  "progress": 100,
  "result": {...}
}
                      </v-code>
                    </v-card-text>
                  </v-card>
                </div>
              </v-card-text>
            </v-card>
          </v-window-item>

          <!-- Authentication Guide Tab -->
          <v-window-item value="2">
            <v-card elevation="2" class="pa-4">
              <v-card-title class="headline">
                <v-icon left>mdi-shield-key</v-icon>
                Machine-to-Machine Authentication
              </v-card-title>
              <v-card-text>
                <div class="auth-guide">
                  <v-alert type="info" variant="tonal" class="mb-4">
                    This API uses AWS IAM authentication with SigV4 signing. Follow these steps to authenticate programmatically.
                  </v-alert>

                  <h3 class="text-h6 mb-3">1. Authentication</h3>
                  <p class="mb-3">With raw HTTP (OAuth2 flow):</p>
                  <v-code class="mb-4">
<pre>curl -X POST "https://{{ apiHostname }}/oauth2/token"
        -H "Content-Type: application/x-www-form-urlencoded"
        -d "grant_type=client_credentials&client_id={client-id}&client_secret={client-secret}"
</pre>     
                  </v-code>

                  <h3 class="text-h6 mb-3">2. The Authentication API responds with a JWT token</h3>
                  <p class="mb-3">The response includes an <code>access_token</code> → used for API access.</p>
                  <v-code class="mb-4">
{"access_token":"eyJraWQiOiJWSHRuOThITWNDMzBQekEzODJ2RGxLbUJFOE9lNU5abVE3QmROYUl4WkI0PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiIzbXU5dnRnZmR0cWZscTJzbm5wZjFrN2R1YiIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoiZGVmYXVsdC1tMm0tcmVzb3VyY2Utc2VydmVyLXZlcTllcVwvcmVhZCIsImF1dGhfdGltZSI6MTc1NzA3MzExNSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLXNvdXRoZWFzdC0yLmFtYXpvbmF3cy5jb21cL2FwLXNvdXRoZWFzdC0yX3FCbEZlNTdMNiIsImV4cCI6MTc1NzA3NjcxNSwiaWF0IjoxNzU3MDczMTE1LCJ2ZXJzaW9uIjoyLCJqdGkiOiIxZTI0ZGIxZi05NTUxLTRjZDctOGQ4MC00NzhiZjRhY2FhMDEiLCJjbGllbnRfaWQiOiIzbXU5dnRnZmR0cWZscTJzbm5wZjFrN2R1YiJ9.BxqdcrAr8KBHZTCDiGL8ekvvotbA_7t78pvNdFgQbLMgOqTHFBvpMZSCRaWMGWFIO_P_XlWViV0YSxutC709M2z_9UWom4eG_f2QriPNYK6XYjUg30y5TSCdslTss_ab8b_wIUu2ju7ftHCgdbWTgyt0EIcMg9fj9Udxui0N7hC06OMBUbi3tDOqG3tJzXCfefN9MUKpIK7x6AEd2-OkB2DtEEiwstL6YGIeNhTPsbDPfcjoUcHiBRRF55AYMOWfDg6xfWqSP2gXmiqafxu3PovT_OefP2haQBzYWzEqn5TwKQ1S-HWGnoTwCbL-JBezeBhz07Ye0uy9alqiCUCCPA","expires_in":3600,"token_type":"Bearer"}
                  </v-code>

                  <h3 class="text-h6 mb-3">3. Using the Token with the API</h3>
                  <v-code class="mb-4">
<pre>curl -X POST "https://{{ apiHostname }}/inference"
    -H "Authorization: Bearer {access_token}"</pre>
                  </v-code>


                  <v-alert type="warning" variant="tonal" class="mt-4">
                    <strong>Security Note:</strong> Never expose AWS credentials in client-side code. 
                    Use temporary credentials, IAM roles, or AWS Cognito for browser-based applications.
                  </v-alert>
                </div>
              </v-card-text>
            </v-card>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
// Use default import for Amplify API client
import { post } from '@aws-amplify/api';

// Types
interface InferenceResult {
  success: boolean;
  data?: any;
  message: string;
  error?: string;
}

// Reactive data
const activeTab = ref(0);
const validForm = ref(false);
const selectedFile = ref<File[]>([]);
const additionalParams = ref('');
const isProcessing = ref(false);
const inferenceResult = ref<InferenceResult | null>(null);

// API configuration
const apiBaseUrl = computed(() => {
  // Get from Amplify outputs - adjust based on your environment
  return 'https://api.d2ai.info';
});

const apiHostname = computed(() => {
  return apiBaseUrl.value.replace('https://', '');
});

// Validation rules
const fileRules = [
  (files: File[]) => {
    if (!files || files.length === 0) return 'File is required';
    const file = files[0];
    if (file.size > 10 * 1024 * 1024) return 'File size must be less than 10MB';
    return true;
  }
];

// Computed properties
const resultColor = computed(() => {
  if (!inferenceResult.value) return 'info';
  return inferenceResult.value.success ? 'success' : 'error';
});

const resultIcon = computed(() => {
  if (!inferenceResult.value) return 'mdi-information';
  return inferenceResult.value.success ? 'mdi-check-circle' : 'mdi-alert-circle';
});

// Methods
const processInference = async () => {
  if (!selectedFile.value?.[0]) return;

  try {
    isProcessing.value = true;
    inferenceResult.value = null;

    // Convert file to base64
    const fileData = await fileToBase64(selectedFile.value[0]);
    
    // Parse additional parameters
    let parsedParams = {};
    if (additionalParams.value.trim()) {
      try {
        parsedParams = JSON.parse(additionalParams.value);
      } catch (e) {
        throw new Error('Invalid JSON format in additional parameters');
      }
    }

    // Prepare request body
    const requestBody = {
      data: fileData,
      fileName: selectedFile.value[0].name,
      parameters: parsedParams
    };

    // Make API call using Amplify API module with IAM auth
    const result = await post({
      apiName: 'InferenceHttpApi',
      path: '/inference',
      options: {
        body: requestBody,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });

    inferenceResult.value = {
      success: true,
      data: result,
      message: 'Inference completed successfully!'
    };
  } catch (error: any) {
    console.error('Inference failed:', error);
    
    inferenceResult.value = {
      success: false,
      message: 'Inference failed. Please check your file and try again.',
      error: error.message || 'Unknown error occurred'
    };
  } finally {
    isProcessing.value = false;
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Lifecycle
onMounted(() => {
  // Initialize any required data
  console.log('Inference API page mounted');
});
</script>

<style scoped>
.v-card {
  border-radius: 12px;
  transition: transform 0.3s ease;
}

.headline {
  border-bottom: 2px solid #1976d2;
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.api-docs h3,
.api-docs h4 {
  color: #1976d2;
}

.auth-guide h3 {
  color: #1976d2;
}

.result-code {
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  background-color: #f5f5f5;
  padding: 16px;
  border-radius: 4px;
  font-family: 'Roboto Mono', monospace;
}

.v-code {
  display: block;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 12px;
  font-family: 'Roboto Mono', monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>