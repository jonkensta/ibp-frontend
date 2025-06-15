<template>
  <div class="d-flex flex-column align-items-center pt-5">
    <h1 class="h4 fw-bold mb-4">Search Inmates</h1>

    <div class="d-flex flex-column gap-4 w-100" style="max-width: 28rem">
      <form @submit.prevent="handleSearch" class="d-flex gap-2">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Enter Inmate Name or ID"
          class="form-control flex-grow-1"
        />
        <button type="submit" :disabled="isLoading" class="btn btn-success">Search</button>
      </form>

      <div v-if="isLoading" class="p-4 text-center">Loading...</div>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div v-if="apiErrors.length > 0">
        <h2 class="h5 fw-semibold mb-2">Search Errors:</h2>
        <div
          v-for="(err, index) in apiErrors"
          :key="index"
          class="alert alert-warning"
          role="alert"
        >
          {{ err }}
        </div>
      </div>

      <div v-if="searchResults.length > 0 && !isLoading">
        <h2 class="h5 fw-semibold mb-2">Search Results:</h2>
        <simple-table
          :columns="inmateTableColumns"
          :data="searchResults"
          @row-click="viewInmateDetails"
          row-hover
        />
      </div>

      <div
        v-else-if="!isLoading && hasSearched && searchResults.length === 0"
        class="p-4 text-center text-muted"
      >
        No inmates found matching your query.
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  searchInmates,
  type Inmate,
  type InmateSearchResult,
  type InmateSearchResults,
} from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'

const searchQuery = ref('')
const searchResults = ref<InmateSearchResult[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const apiErrors = ref<string[]>([])
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch search results.'
    error.value = message
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
