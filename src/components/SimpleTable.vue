<template>
  <div class="simple-table-container">
    <table :class="['table', { 'table-hover': rowHover }]">
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
            <span
              v-html="
                getNestedValue(item, column.key) !== undefined
                  ? String(getNestedValue(item, column.key))
                  : 'N/A'
              "
            />
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
  data: Record<string, unknown>[]
  rowHover?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits(['row-click'])

function onRowClick(item: Record<string, unknown>) {
  if (props.rowHover) {
    emit('row-click', item)
  }
}

// Helper to get nested values using dot notation
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path) return obj
  const keys = path.split('.')
  let result: unknown = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = (result as Record<string, unknown>)[key]
    } else {
      return undefined // Or a default value like 'N/A' or null
    }
  }
  return result
}
</script>

<style scoped>
.simple-table-container {
  overflow-x: auto;
}

.table-hover tbody tr:hover {
  cursor: pointer;
}
</style>
