<template>
  <div class="storage-container">
    <!-- Toolbar -->
    <div class="toolbar pa-4 bg-grey-lighten-4">
      <v-file-input
        ref="fileInput"
        v-model="selectedFiles"
        multiple
        prepend-icon="mdi-paperclip"
        label="Select files"
        style="display: none"
        @change="handleFileSelect"
      />
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="triggerFileInput"
        class="mr-2"
      >
        Upload
      </v-btn>
      <v-btn
        color="error"
        prepend-icon="mdi-delete"
        @click="deleteSelected"
        :disabled="!selectedFile"
        class="mr-2"
      >
        Delete
      </v-btn>
      <v-btn
        color="success"
        prepend-icon="mdi-download"
        @click="downloadSelected"
        :disabled="!selectedFile"
        class="mr-2"
      >
        Download
      </v-btn>
      <v-btn
        icon
        @click="refreshFiles"
        title="Refresh"
      >
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <!-- File Table -->
    <v-table
      fixed-header
      height="calc(100vh - 180px)"
      hover
      class="file-table"
    >
      <thead>
        <tr>
          <th>Name</th>
          <th class="text-right">Size</th>
          <th>Modified</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="file in files"
          :key="file.key"
          @click="selectFile(file)"
          :class="{ 'selected-row': selectedFile?.key === file.key }"
        >
          <td>
            <v-icon :icon="getFileIcon(file.key)" class="mr-2"></v-icon>
            {{ getFileName(file.key) }}
          </td>
          <td class="text-right">{{ formatFileSize(file.size) }}</td>
          <td>{{ formatDate(file.lastModified) }}</td>
          <td>
            <v-btn
              icon
              size="small"
              variant="text"
              @click.stop="downloadFile(file)"
            >
              <v-icon>mdi-download</v-icon>
            </v-btn>
          </td>
        </tr>
        <tr v-if="files.length === 0">
          <td colspan="4" class="text-center py-8 text-grey">
            No files found. Upload your first file.
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-warning">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Confirm Delete
        </v-card-title>
        <v-card-text>
          Are you sure you want to delete this file?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog = false"
          >Cancel</v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Loading Overlay -->
    <v-overlay
      v-model="loading"
      contained
      class="align-center justify-center"
      persistent
    >
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </v-overlay>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '../stores'
import { ref, onMounted } from 'vue';
import { 
  uploadData, 
  downloadData, 
  list, 
  remove 
} from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';


interface S3File {
  key: string;
  size: number;
  lastModified: Date;
}

const files = ref<S3File[]>([]);
const selectedFile = ref<S3File | null>(null);
const selectedFiles = ref(null);
const loading = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const deleteDialog = ref(false);

// Get current user's S3 prefix
const getUserPrefix = async (): Promise<string> => {
  const user = await useAuthStore().userObject
  return `users/${user.username}/`;
};

// Fetch files from S3
const fetchFiles = async () => {

  try {
    const prefix = await getUserPrefix();
    loading.value = true;
  
    const { items } = await list({ 
      path: prefix,
      options: {
        pageSize: 100
      }
    });
    
    files.value = items
      .filter(item => !item.path.endsWith('/')) // exclude folders  
      .map(item => ({
        key: item.path,
        size: item.size || 0,
        lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
        isFolder: item.path.endsWith('/'),
      }));
    
  } catch (error) {
    console.error('Error fetching files:', error);
  } finally {
    loading.value = false;
  }
};

// File selection
const selectFile = (file: S3File) => {
  selectedFile.value = file;
};

// Trigger file input
const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.value = '';
    fileInput.value.click();
  }
};

// Handle file upload
const handleFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  loading.value = true;
  try {
    const prefix = await getUserPrefix();
    await uploadData({
      path: `${prefix}${file.name}`,
      data: file
    }).result;
    await fetchFiles();
  } catch (error) {
    console.error('Upload error:', error);
  } finally {
    loading.value = false;
  }
};

// Delete file flow
const deleteSelected = () => {
  if (selectedFile.value) {
    deleteDialog.value = true;
  }
};

const confirmDelete = async () => {
  if (!selectedFile.value) return;

  loading.value = true;
  try {
    await remove({ path: selectedFile.value.key });
    selectedFile.value = null;
    await fetchFiles();
  } catch (error) {
    console.error('Delete error:', error);
  } finally {
    loading.value = false;
    deleteDialog.value = false;
  }
};

// Download operations
const downloadSelected = () => {
  if (selectedFile.value) {
    downloadFile(selectedFile.value);
  }
};

const downloadFile = async (file: S3File) => {
  loading.value = true;
  try {
    const { body } = await downloadData({ path: file.key }).result;
    const blob = await body.blob();
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = getFileName(file.key);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
  } finally {
    loading.value = false;
  }
};

// Refresh file list
const refreshFiles = async () => {
  selectedFile.value = null;
  await fetchFiles();
};

// Helper functions
const getFileName = (path: string) => path.split('/').pop() || path;

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i]);
};

const formatDate = (date: Date) => date.toLocaleString();

const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  const icons: Record<string, string> = {
    pdf: 'mdi-file-pdf',
    doc: 'mdi-file-word',
    docx: 'mdi-file-word',
    xls: 'mdi-file-excel',
    xlsx: 'mdi-file-excel',
    jpg: 'mdi-file-image',
    jpeg: 'mdi-file-image',
    png: 'mdi-file-image',
    gif: 'mdi-file-image',
    mp3: 'mdi-file-music',
    wav: 'mdi-file-music',
    mp4: 'mdi-file-video',
    mov: 'mdi-file-video',
    zip: 'mdi-folder-zip',
    rar: 'mdi-folder-zip',
  };
  return icons[extension || ''] || 'mdi-file';
};

// Initialize
onMounted(async () => {
  await fetchFiles()
});
</script>

<style scoped>
.storage-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.file-table {
  flex: 1;
}

.selected-row {
  background-color: rgba(25, 118, 210, 0.08);
}

.v-table {
  --v-table-row-height: 56px;
}
</style>
