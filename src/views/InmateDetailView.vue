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


        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Requests</h2>
          <div class="flex items-center gap-2 mb-2">
            <input type="date" v-model="postmarkDate" class="border p-1 rounded" />
            <button
              ref="createButton"
              @click="createRequest"
              class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create Request
            </button>
          </div>
          <simple-table
            v-if="inmate.requests && inmate.requests.length > 0"
            :columns="requestsTableColumns"
            :data="inmate.requests"
          />
          <p v-else>No requests found for this inmate.</p>
        </section>

        <section class="bg-white dark:bg-gray-800 p-4 rounded shadow w-full md:w-[48%]">
          <h2 class="text-xl font-semibold mb-2">Comments</h2>
          <div class="flex items-center gap-2 mb-2">
            <button
              @click="openCommentModal"
              class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Create Comment
            </button>
          </div>
          <simple-table
            v-if="inmate.comments && inmate.comments.length > 0"
            :columns="commentsTableColumns"
            :data="inmate.comments"
          />
          <p v-else>No comments found for this inmate.</p>
        </section>
        <BaseModal :show="showCommentModal" @close="closeCommentModal">
          <h3 class="text-lg font-semibold mb-2">New Comment</h3>
          <div class="mb-2">
            <label class="block mb-1">Author</label>
            <input v-model="commentAuthor" type="text" class="w-full border p-1 rounded" />
          </div>
          <div class="mb-2">
            <label class="block mb-1">Comment</label>
            <textarea v-model="commentBody" class="w-full border p-1 rounded" rows="3"></textarea>
          </div>
          <div class="mb-2 text-sm text-gray-600">Date: {{ commentDate }}</div>
          <div class="flex justify-end gap-2">
            <button class="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300" @click="closeCommentModal">
              Cancel
            </button>
            <button class="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700" @click="createComment">
              Save
            </button>
          </div>
        </BaseModal>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import {
  getInmateDetails,
  addRequest,
  addComment,
  type Inmate,
} from '@/api'
import SimpleTable, { type TableColumn } from '@/components/SimpleTable.vue'
import BaseModal from '@/components/BaseModal.vue'
const inmate = ref<Inmate | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/`
}

const today = new Date().toISOString().slice(0, 10)
const postmarkDate = ref(getCookie('postmarkDate') || today)
const createButton = ref<HTMLButtonElement | null>(null)
const showCommentModal = ref(false)
const commentAuthor = ref('')
const commentBody = ref('')
const commentDate = ref('')

watch(postmarkDate, (val) => setCookie('postmarkDate', val))

function createUrlAnchor(url: string | null | undefined): string {
  if (!url) return ''
  const text = url.includes('tdcj.texas.gov')
    ? 'TDCJ Page'
    : url.includes('bop.gov')
      ? 'FBOP page'
      : url
  return `<a href="${url}" target="_blank" rel="noopener">${text}</a>`
}

const props = defineProps<{
  jurisdiction: string
  id: string
}>()

const inmateInfoColumns: TableColumn[] = [
  { key: 'id', label: 'Inmate ID' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'race', label: 'Race' },
  { key: 'sex', label: 'Sex' },
  { key: 'release', label: 'Release' },
  { key: 'url', label: 'URL' },
  { key: 'datetime_fetched', label: 'Fetched At' },
  { key: 'unit_name', label: 'Unit Name' },
  { key: 'unit_jurisdiction', label: 'Unit Jurisdiction' },
  { key: 'unit_street1', label: 'Unit Street 1' },
  { key: 'unit_street2', label: 'Unit Street 2' },
  { key: 'unit_city', label: 'Unit City' },
  { key: 'unit_state', label: 'Unit State' },
  { key: 'unit_zipcode', label: 'Unit Zipcode' },
  { key: 'unit_url', label: 'Unit URL' },
  { key: 'unit_shipping_method', label: 'Unit Shipping Method' },
]

const requestsTableColumns: TableColumn[] = [
  { key: 'index', label: 'Index' },
  { key: 'date_postmarked', label: 'Date Postmarked' },
  { key: 'date_processed', label: 'Date Processed' },
  { key: 'action', label: 'Action' },
  { key: 'status', label: 'Status' },
]

const commentsTableColumns: TableColumn[] = [
  { key: 'index', label: 'Index' },
  { key: 'datetime_created', label: 'Date Created' },
  { key: 'body', label: 'Comment' },
  { key: 'author', label: 'Author' },
]

const inmateInfoForTable = computed(() => {
  if (!inmate.value) return {}
  // Select specific fields for the inmate info table if needed, or transform them
  return {
    id: inmate.value.id,
    jurisdiction: inmate.value.jurisdiction,
    first_name: inmate.value.first_name,
    last_name: inmate.value.last_name,
    race: inmate.value.race,
    sex: inmate.value.sex,
    release: inmate.value.release,
    url: createUrlAnchor(inmate.value.url),
    datetime_fetched: inmate.value.datetime_fetched,
    unit_name: inmate.value.unit?.name,
    unit_jurisdiction: inmate.value.unit?.jurisdiction,
    unit_street1: inmate.value.unit?.street1,
    unit_street2: inmate.value.unit?.street2,
    unit_city: inmate.value.unit?.city,
    unit_state: inmate.value.unit?.state,
    unit_zipcode: inmate.value.unit?.zipcode,
    unit_url: createUrlAnchor(inmate.value.unit?.url),
    unit_shipping_method: inmate.value.unit?.shipping_method,
  }
})

async function fetchDetails() {
  isLoading.value = true
  error.value = null
  try {
    inmate.value = await getInmateDetails(props.jurisdiction, props.id)
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : `Failed to fetch details for inmate ${props.id}.`
    error.value = message
    inmate.value = null
  } finally {
    isLoading.value = false
  }
}

async function createRequest() {
  if (!inmate.value) return
  try {
    const newReq = await addRequest(inmate.value.jurisdiction, inmate.value.id, {
      date_postmarked: postmarkDate.value,
      date_processed: today,
      action: 'Filled',
    })
    if (!inmate.value.requests) {
      inmate.value.requests = []
    }
    inmate.value.requests.push(newReq)
    inmate.value.requests.sort((a, b) => a.index - b.index)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create request.'
    error.value = message
  }
}

function openCommentModal() {
  commentDate.value = new Date().toISOString()
  showCommentModal.value = true
}

function closeCommentModal() {
  showCommentModal.value = false
  commentAuthor.value = ''
  commentBody.value = ''
}

async function createComment() {
  if (!inmate.value) return
  try {
    const newComment = await addComment(inmate.value.jurisdiction, inmate.value.id, {
      body: commentBody.value,
      author: commentAuthor.value,
      datetime_created: commentDate.value,
    })
    if (!inmate.value.comments) {
      inmate.value.comments = []
    }
    inmate.value.comments.push(newComment)
    inmate.value.comments.sort((a, b) => a.index - b.index)
    closeCommentModal()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create comment.'
    error.value = message
  }
}

onMounted(async () => {
  await fetchDetails()
  await nextTick()
  createButton.value?.focus()
})

// Watch for route param changes if navigating between inmate pages directly
watch(() => [props.jurisdiction, props.id], fetchDetails, { immediate: false })
</script>
