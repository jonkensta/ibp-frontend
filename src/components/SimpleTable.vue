<template>
  <div class="simple-table-container">
    <table class="simple-table">
      <thead>
        <tr>
          <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(item, rowIndex) in data"
          :key="rowIndex"
          @click="onRowClick(item)"
          :class="{ 'clickable-row': rowHover }"
        >
          <td v-for="column in columns" :key="`${rowIndex}-${column.key}`">
            {{
              getNestedValue(item, column.key) !== undefined
                ? getNestedValue(item, column.key)
                : 'N/A'
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

export interface TableColumn {
  key: string // Can be a dot-separated path for nested objects e.g. 'details.status'
  label: string
}

interface Props {
  columns: TableColumn[]
  data: any[]
  rowHover?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['row-click'])

function onRowClick(item: any) {
  if (props.rowHover) {
    emit('row-click', item)
  }
}

// Helper to get nested values using dot notation
function getNestedValue(obj: any, path: string): any {
  if (!path) return obj
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return undefined // Or a default value like 'N/A' or null
    }
  }
  return result
}
</script>

<style scoped>
.simple-table-container {
  overflow-x: auto; /* Allows table to scroll horizontally on small screens */
}
.simple-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.9rem;
  background-color: var(--vt-c-white);
}

.simple-table th,
.simple-table td {
  border: 1px solid var(--color-border);
  padding: 0.75rem;
  text-align: left;
  color: var(--vt-c-text-light-1);
}

.simple-table th {
  background-color: var(--color-background-mute);
  font-weight: bold;
  color: var(--color-heading);
}

.simple-table tbody tr:nth-child(even) {
  background-color: var(--color-background-soft);
}

.simple-table tbody tr.clickable-row:hover {
  background-color: var(--vt-c-divider-light-2); /* A light grey, adjust as needed */
  cursor: pointer;
}

/* Dark mode styles for table */
@media (prefers-color-scheme: dark) {
  .simple-table {
    background-color: var(--vt-c-black-soft);
  }
  .simple-table th,
  .simple-table td {
    border-color: var(--vt-c-divider-dark-1);
    color: var(--vt-c-text-dark-1);
  }
  .simple-table th {
    background-color: var(--vt-c-black-mute);
    color: var(--vt-c-text-dark-1);
  }
  .simple-table tbody tr:nth-child(even) {
    background-color: var(--vt-c-black);
  }
  .simple-table tbody tr.clickable-row:hover {
    background-color: var(--vt-c-black-mute);
  }
}
</style>
