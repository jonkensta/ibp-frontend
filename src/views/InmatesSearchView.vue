<template>
  <div class="inmates-search-view">
    <h1>Search Inmates</h1>
    <form @submit.prevent="handleSearch">
      <input type="text" v-model="searchQuery" placeholder="Enter Inmate Name or ID" />
      <button type="submit" :disabled="isLoading">Search</button>
    </form>

    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-if="error" class="error-message">{{ error }}</div>

    <div v-if="searchResults.length > 0 && !isLoading">
      <h2>Search Results</h2>
      <simple-table
        :columns="inmateTableColumns"
        :data="searchResults"
        @row-click="viewInmateDetails"
        row-hover
      />
    </div>
    <div v-else-if="!isLoading && hasSearched && searchResults.length === 0" class="no-results">
      No inmates found matching your query.
    </div>
    <div v-if="apiErrors.length > 0" class="api-errors">
      <h3>API Errors:</h3>
      <ul>
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

<style scoped>
.inmates-search-view {
  padding: 1rem;
}
form {
  margin-bottom: 1rem;
  display: flex;
  gap: 0.5rem;
}
input[type='text'] {
  padding: 0.5rem;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  flex-grow: 1;
}
button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  background-color: var(--color-heading);
  color: var(--vt-c-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}
button:hover:not(:disabled) {
  background-color: hsla(160, 100%, 37%, 0.8);
}
button:disabled {
  background-color: var(--color-border);
  cursor: not-allowed;
}
.loading,
.error-message,
.no-results {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 4px;
}
.loading {
  color: var(--color-text);
}
.error-message {
  color: red;
  background-color: #ffe0e0;
  border: 1px solid red;
}
.no-results {
  color: var(--color-text-light-2);
}
.api-errors {
  margin-top: 1rem;
  padding: 1rem;
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
  border-radius: 4px;
}
.api-errors ul {
  list-style-type: disc;
  padding-left: 20px;
}
</style>
