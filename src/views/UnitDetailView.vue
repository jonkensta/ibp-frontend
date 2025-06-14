<template>
  <div class="p-4 d-flex flex-column gap-4">
    <button @click="$router.back()" class="align-self-start btn btn-secondary">
      &larr; Back to Units List
    </button>
    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading unit details...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-danger bg-danger-subtle rounded border border-danger"
    >
      {{ error }}
    </div>

    <div v-if="unit && !isLoading" class="unit-content d-flex flex-column align-items-center gap-4">
      <h1 class="h4 fw-bold mb-2">Unit: {{ unit.name }}</h1>
      <div class="d-flex flex-wrap justify-content-center gap-4 w-100">
        <section class="bg-white p-4 rounded shadow w-100 col-md-5">
          <h2 class="h5 fw-semibold mb-2">Unit Information</h2>
          <simple-table :columns="unitInfoColumns" :data="[unitInfoForTable]" />
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { getUnitDetails, type Unit } from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const unit = ref<Unit | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

function createUrlAnchor(url: string | null | undefined, text?: string): string {
  if (!url) return text || ''
  const label =
    text ||
    (url.includes('tdcj.texas.gov') ? 'TDCJ Page' : url.includes('bop.gov') ? 'FBOP page' : url)
  return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
}

const props = defineProps<{
  jurisdiction: string
  name: string
}>()

const unitInfoColumns: TableColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'street1', label: 'Street 1' },
  { key: 'street2', label: 'Street 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zipcode', label: 'Zipcode' },
  { key: 'url', label: 'URL' },
  { key: 'shipping_method', label: 'Shipping Method' },
]

const unitInfoForTable = computed(() => {
  if (!unit.value) return {}
  return {
    name: unit.value.name,
    jurisdiction: unit.value.jurisdiction,
    street1: unit.value.street1,
    street2: unit.value.street2,
    city: unit.value.city,
    state: unit.value.state,
    zipcode: unit.value.zipcode,
    url: createUrlAnchor(unit.value.url),
    shipping_method: unit.value.shipping_method,
  }
})

async function fetchDetails() {
  isLoading.value = true
  error.value = null
  try {
    unit.value = await getUnitDetails(props.jurisdiction, props.name)
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : `Failed to fetch details for unit ${props.name}.`
    error.value = message
    unit.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDetails)
watch(() => [props.jurisdiction, props.name], fetchDetails, { immediate: false })
</script>
