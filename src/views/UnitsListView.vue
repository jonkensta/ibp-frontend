<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Correctional Units</h1>
    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading units...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-red-600 bg-red-100 rounded border border-red-400"
    >
      {{ error }}
    </div>

    <div v-if="units.length > 0 && !isLoading">
      <simple-table
        :columns="unitTableColumns"
        :data="units"
        @row-click="viewUnitDetails"
        row-hover
      />
    </div>
    <div
      v-else-if="!isLoading && units.length === 0 && !error"
      class="mt-4 p-4 text-center text-gray-500"
    >
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
