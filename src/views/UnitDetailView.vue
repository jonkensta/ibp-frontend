<template>
  <div class="p-4 flex flex-col gap-4">
    <button
      @click="$router.back()"
      class="self-start px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
    >
      &larr; Back to Units List
    </button>
    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading unit details...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-red-600 bg-red-100 rounded border border-red-400"
    >
      {{ error }}
    </div>

    <div v-if="unit && !isLoading" class="unit-content flex flex-col items-center gap-4">
      <h1 class="text-2xl font-bold mb-2">Unit: {{ unit.name }}</h1>
      <div class="flex flex-wrap justify-center gap-4 w-full">
        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Unit Information</h2>
          <simple-table :columns="unitInfoColumns" :data="[unitInfoForTable]" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getUnitDetails, type Unit } from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const route = useRoute()
const unit = ref<Unit | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const props = defineProps<{
  jurisdiction: string
  name: string
}>()

const unitInfoColumns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'address', label: 'Address' },
  // Add other relevant fields from the Unit schema
]

const unitInfoForTable = computed(() => {
  if (!unit.value) return {}
  return {
    name: unit.value.name,
    jurisdiction: unit.value.jurisdiction,
    address: unit.value.address || 'N/A',
    // Map other fields from unit.value
  }
})

async function fetchDetails() {
  isLoading.value = true
  error.value = null
  try {
    unit.value = await getUnitDetails(props.jurisdiction, props.name)
  } catch (err: any) {
    error.value = err.message || `Failed to fetch details for unit ${props.name}.`
    unit.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDetails)
watch(() => [props.jurisdiction, props.name], fetchDetails, { immediate: false })
</script>
