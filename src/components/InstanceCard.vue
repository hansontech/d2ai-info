<template>
    <v-card
      class="instance-card"
      :class="`status-${instance.state}`"
      @click="$emit('select', instance.instanceId)"
    >
      <v-card-title class="card-header">
        <h4>{{ instance.instanceId }}</h4>
        <v-chip
        :color="getStatusColor(instance.state)"
        size="small"
        variant="flat"
        >
        {{ instance.state }}
      </v-chip>
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" class="py-1">
            <span class="text-medium-emphasis font-weight-medium me-2">Model Name:</span>
            <span>{{ instance.modelName }}</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="py-1">
            <span class="text-medium-emphasis font-weight-medium me-2">Code:</span>
            <span>{{ instance.modelName }}</span>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="py-1">
              <span class="text-medium-emphasis font-weight-medium me-2">Instance Type:</span>
              <span>{{ instance.instanceType }}</span>
          </v-col>
        </v-row>
        <v-row>   
          <v-col cols="12" class="py-1">
            <span class="text-medium-emphasis font-weight-medium me-2">Launched:</span>
            <span>{{ formatDate(instance.launchTime) }}</span>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </template>
  
  <script setup lang="ts">
  import type { EC2Instance } from '../types/ec2';
  import { computed } from 'vue';
  
  const props = defineProps<{
    instance: EC2Instance;
  }>();
  
  defineEmits(['select']);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Define the possible instance states
  type InstanceState = 'running' | 'stopped' | 'pending' | 'stopping' | 'terminated';

  // Define the possible color values (adjust based on your UI framework's color options)
  type StatusColor = 'success' | 'error' | 'warning' | 'default';

  // Define the function directly in setup
  const getStatusColor = (state: string): StatusColor => {
    const statusColors: Record<InstanceState, StatusColor> = {
      'running': 'success',
      'stopped': 'error',
      'pending': 'warning',
      'stopping': 'warning',
      'terminated': 'error'
    };
    
    return (statusColors as Record<string, StatusColor>)[state] || 'default';
  };
  
  </script>
  
  <script lang="ts">
  export default {
    name: 'InstanceCard'
  };
  </script>

  <style scoped>
  .instance-card {
    border: 1px solid #e1e1e1;
    border-radius: 8px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    background-color: #fff;
  }
  
  .instance-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: #0d6efd;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
  }
  
  .status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
    text-transform: capitalize;
  }
  
  .status-pending .status-badge {
    background-color: #ffc107;
    color: #333;
  }
  
  .status-running .status-badge {
    background-color: #198754;
    color: white;
  }
  
  .status-stopping .status-badge,
  .status-shutting-down .status-badge {
    background-color: #fd7e14;
    color: white;
  }
  
  .status-stopped .status-badge {
    background-color: #6c757d;
    color: white;
  }
  
  .status-terminated .status-badge {
    background-color: #dc3545;
    color: white;
  }
  
  .detail {
    display: flex;
    margin-bottom: 8px;
  }
  
  .detail label {
    font-weight: 500;
    min-width: 90px;
    color: #6c757d;
  }
  
  .detail span {
    word-break: break-all;
  }
  </style>