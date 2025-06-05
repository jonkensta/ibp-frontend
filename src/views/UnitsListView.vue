<template>
  <div class="units-list-view">
    <h1>Correctional Units</h1>
    <div v-if="isLoading" class="loading">Loading units...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="units.length > 0 && !isLoading">
      <simple-table
        :columns="unitTableColumns"
        :data="units"
        @row-click="viewUnitDetails"
        row-hover
      />
    </div>
    <div v-else-if="!isLoading && units.length === 0 && !error" class="no-results">
      No units found.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllUnits, type Unit } from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const units = ref<Unit[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const router = useRouter()

const unitTableColumns: TableColumn[] = [
  { key: 'name', label: 'Unit Name' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  // Add other relevant fields like address if available directly or on a summary object
]

async function fetchUnitsData() {
  isLoading.value = true
  error.value = null
  try {
    units.value = await getAllUnits()
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch units.'
    units.value = []
  } finally {
    isLoading.value = false
  }
}

function viewUnitDetails(unit: Unit) {
  if (unit.jurisdiction && unit.name) {
    router.push({
      name: 'unit-detail',
      params: { jurisdiction: unit.jurisdiction, name: unit.name },
    })
  } else {
    error.value = 'Unit data is incomplete for navigation.'
  }
}

onMounted(fetchUnitsData)
</script>

<style scoped>
.units-list-view {
  padding: 1rem;
}
.units-list-view h1 {
  margin-bottom: 1.5rem;
}
.loading,
.error-message,
.no-results {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
}
.error-message {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
}
.no-results {
  color: var(--color-text-light-2);
}
</style>
