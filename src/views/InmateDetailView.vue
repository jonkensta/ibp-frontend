<template>
  <div class="p-4 flex flex-col gap-4">
    <button
      @click="$router.back()"
      class="self-start px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
    >
      &larr; Back to Search
    </button>
    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading inmate details...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-red-600 bg-red-100 rounded border border-red-400"
    >
      {{ error }}
    </div>

    <div v-if="inmate && !isLoading" class="inmate-content flex flex-col items-center gap-4">
      <h1 class="text-2xl font-bold mb-2">
        Inmate: {{ inmate.first_name }} {{ inmate.last_name }}
      </h1>

      <div class="flex flex-wrap justify-center gap-4 w-full">
        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Inmate Information</h2>
          <simple-table :columns="inmateInfoColumns" :data="[inmateInfoForTable]" />
        </section>

        <section
          class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]"
          v-if="inmate.unit"
        >
          <h2 class="text-xl font-semibold mb-2">Assigned Unit</h2>
          <p>
            <router-link
              :to="{
                name: 'unit-detail',
                params: { jurisdiction: inmate.unit.jurisdiction, name: inmate.unit.name },
              }"
              class="text-blue-600 hover:underline"
            >
              {{ inmate.unit.name }} ({{ inmate.unit.jurisdiction }})
            </router-link>
          </p>
        </section>

        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Requests</h2>
          <simple-table
            v-if="inmate.requests && inmate.requests.length > 0"
            :columns="requestsTableColumns"
            :data="inmate.requests"
          />
          <p v-else>No requests found for this inmate.</p>
        </section>

        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Comments</h2>
          <simple-table
            v-if="inmate.comments && inmate.comments.length > 0"
            :columns="commentsTableColumns"
            :data="inmate.comments"
          />
          <p v-else>No comments found for this inmate.</p>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getInmateDetails, type Inmate, type InmateRequest, type InmateComment } from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const route = useRoute()
const inmate = ref<Inmate | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

const props = defineProps<{
  jurisdiction: string
  id: string
}>()

const inmateInfoColumns: TableColumn[] = [
  { key: 'id', label: 'Inmate ID' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'date_of_birth', label: 'Date of Birth' },
  // Add more relevant fields from the Inmate schema
]

const requestsTableColumns: TableColumn[] = [
  { key: 'index', label: 'Index' },
  { key: 'date_postmarked', label: 'Date Postmarked' },
  // Add other relevant request fields
]

const commentsTableColumns: TableColumn[] = [
  { key: 'index', label: 'Index' },
  { key: 'datetime_created', label: 'Date Created' },
  { key: 'text', label: 'Comment' },
  // Add other relevant comment fields
]

const inmateInfoForTable = computed(() => {
  if (!inmate.value) return {}
  // Select specific fields for the inmate info table if needed, or transform them
  return {
    id: inmate.value.id,
    jurisdiction: inmate.value.jurisdiction,
    first_name: inmate.value.first_name,
    last_name: inmate.value.last_name,
    date_of_birth: inmate.value.date_of_birth || 'N/A',
    // Map other fields from inmate.value here
  }
})

async function fetchDetails() {
  isLoading.value = true
  error.value = null
  try {
    inmate.value = await getInmateDetails(props.jurisdiction, props.id)
  } catch (err: any) {
    error.value = err.message || `Failed to fetch details for inmate ${props.id}.`
    inmate.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(fetchDetails)

// Watch for route param changes if navigating between inmate pages directly
watch(() => [props.jurisdiction, props.id], fetchDetails, { immediate: false })
</script>
