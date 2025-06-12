<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">Search Inmates</h1>
    <form @submit.prevent="handleSearch" class="mb-4 flex gap-2">
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Enter Inmate Name or ID"
        class="flex-grow p-2 border rounded"
      />
      <button
        type="submit"
        :disabled="isLoading"
        class="px-4 py-2 text-white bg-green-600 rounded disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-green-700"
      >
        Search
      </button>
    </form>

    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-red-600 bg-red-100 rounded border border-red-400"
    >
      {{ error }}
    </div>

    <div v-if="searchResults.length > 0 && !isLoading">
      <h2 class="text-xl font-semibold mb-2">Search Results</h2>
      <simple-table
        :columns="inmateTableColumns"
        :data="searchResults"
        @row-click="viewInmateDetails"
        row-hover
      />
    </div>
    <div
      v-else-if="!isLoading && hasSearched && searchResults.length === 0"
      class="mt-4 p-4 text-center text-gray-500"
    >
      No inmates found matching your query.
    </div>
    <div
      v-if="apiErrors.length > 0"
      class="mt-4 p-4 bg-yellow-100 border border-yellow-300 text-yellow-700 rounded"
    >
      <h3 class="font-semibold mb-2">API Errors:</h3>
      <ul class="list-disc pl-5">
        <li v-for="(err, index) in apiErrors" :key="index">{{ err.message || err }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { searchInmates, type Inmate, type InmateSearchResults } from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const searchQuery = ref('')
const searchResults = ref<Inmate[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const apiErrors = ref<any[]>([])
const router = useRouter()
const hasSearched = ref(false)

const inmateTableColumns: TableColumn[] = [
  { key: 'id', label: 'Inmate ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
]

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    error.value = 'Please enter a search query.'
    searchResults.value = []
    apiErrors.value = []
    hasSearched.value = false
    return
  }
  isLoading.value = true
  error.value = null
  apiErrors.value = []
  hasSearched.value = true

  try {
    const results: InmateSearchResults = await searchInmates(searchQuery.value)
    searchResults.value = results.inmates
    apiErrors.value = results.errors
  } catch (err: any) {
    error.value = err.message || 'Failed to fetch search results.'
    searchResults.value = []
  } finally {
    isLoading.value = false
  }
}

function viewInmateDetails(inmate: Inmate) {
  if (inmate.jurisdiction && inmate.id) {
    router.push({
      name: 'inmate-detail',
      params: { jurisdiction: inmate.jurisdiction, id: inmate.id },
    })
  } else {
    error.value = 'Inmate data is incomplete for navigation.'
  }
}
</script>
