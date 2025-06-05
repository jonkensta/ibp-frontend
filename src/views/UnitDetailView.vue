<template>
  <div class="unit-detail-view">
    <button @click="$router.back()" class="back-button">&larr; Back to Units List</button>
    <div v-if="isLoading" class="loading">Loading unit details...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="unit && !isLoading" class="unit-content">
      <h1>Unit: {{ unit.name }}</h1>
      <section class="detail-section">
        <h2>Unit Information</h2>
        <simple-table :columns="unitInfoColumns" :data="[unitInfoForTable]" />
      </section>
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

<style scoped>
.unit-detail-view {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.back-button {
  align-self: flex-start;
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-border);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
.back-button:hover {
  background-color: var(--color-border-hover);
}
.unit-content h1 {
  margin-bottom: 1.5rem;
  color: var(--color-heading);
}
.detail-section {
  margin-bottom: 2rem;
  background-color: var(--color-background-soft);
  padding: 1rem;
  border-radius: 8px;
}
.detail-section h2 {
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--color-border);
  padding-bottom: 0.5rem;
}
.loading,
.error-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
  text-align: center;
}
.error-message {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
}
</style>
