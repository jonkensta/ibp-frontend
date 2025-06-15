<template>
  <div class="p-4 d-flex flex-column gap-4">
    <button @click="$router.back()" class="align-self-start btn btn-secondary">
      &larr; Back to Search
    </button>
    <div v-if="isLoading" class="mt-4 p-4 text-center">Loading inmate details...</div>
    <div
      v-if="error"
      class="mt-4 p-4 text-center text-danger bg-danger-subtle rounded border border-danger"
    >
      {{ error }}
    </div>

    <div
      v-if="inmate && !isLoading"
      class="inmate-content d-flex flex-column align-items-center gap-4"
    >
      <h1 class="h4 fw-bold mb-2">Inmate: {{ inmate.first_name }} {{ inmate.last_name }}</h1>
      <div class="row g-4 w-100 justify-content-center">
        <div class="col-12 col-lg-4 d-flex">
          <div class="card flex-fill">
            <div class="card-body">
              <h2 class="h5 fw-semibold mb-2">Inmate Data</h2>
              <ul class="list-unstyled mb-0">
                <li
                  v-for="(item, idx) in inmateInfoList"
                  :key="idx"
                  class="mb-2 text-start"
                >
                  <div class="fw-semibold">{{ item.label }}</div>
                  <div class="text-start" v-html="item.value !== undefined ? item.value : 'N/A'" />
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-4 d-flex">
          <div class="card flex-fill">
            <div class="card-body">
              <h2 class="h5 fw-semibold mb-2">Requests</h2>
              <div class="flex items-center gap-2 mb-2">
                <input type="date" v-model="postmarkDate" class="form-control p-1" />
                <button ref="createButton" @click="createRequest" class="btn btn-primary">
                  Create Request
                </button>
              </div>
              <div v-if="inmate.requests && inmate.requests.length > 0" class="overflow-x-auto">
                <table class="table table-sm">
                  <thead class="table-light">
                    <tr>
                      <th
                        v-for="col in requestsTableColumns"
                        :key="col.key"
                        class="px-2 py-2 text-start"
                      >
                        {{ col.label }}
                      </th>
                      <th class="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(req, i) in inmate.requests" :key="req.index">
                      <td class="px-2 py-2">{{ req.date_postmarked }}</td>
                      <td class="px-2 py-2">{{ req.action }}</td>
                      <td class="px-2 py-2">
                        <button
                          v-if="confirmRequestIndex !== i"
                          @click="confirmRequestIndex = i"
                          aria-label="Delete request"
                          class="btn btn-link text-danger p-0"
                        >
                          <TrashIcon class="w-5 h-5" />
                        </button>
                        <div v-else class="flex items-center gap-1">
                          <span class="mr-1">Are you sure?</span>
                          <button @click="confirmDeleteRequest(i)" aria-label="Confirm delete">
                            <CheckIcon class="w-5 h-5 text-success" />
                          </button>
                          <button @click="confirmRequestIndex = null" aria-label="Cancel delete">
                            <XMarkIcon class="w-5 h-5 text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else>No requests found for this inmate.</p>
            </div>
          </div>
        </div>

        <div class="col-12 col-lg-4 d-flex">
          <div class="card flex-fill">
            <div class="card-body">
              <h2 class="h5 fw-semibold mb-2">Comments</h2>
              <div class="d-flex align-items-center gap-2 mb-2">
                <button @click="openCommentModal" class="btn btn-primary">Create Comment</button>
              </div>
              <div v-if="inmate.comments && inmate.comments.length > 0" class="overflow-x-auto">
                <table class="table table-sm">
                  <thead class="table-light">
                    <tr>
                      <th
                        v-for="col in commentsTableColumns"
                        :key="col.key"
                        class="px-2 py-2 text-start"
                      >
                        {{ col.label }}
                      </th>
                      <th class="w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(cmt, i) in inmate.comments" :key="cmt.index">
                      <td class="px-2 py-2">{{ cmt.index }}</td>
                      <td class="px-2 py-2">{{ cmt.datetime_created }}</td>
                      <td class="px-2 py-2">{{ cmt.body }}</td>
                      <td class="px-2 py-2">{{ cmt.author }}</td>
                      <td class="px-2 py-2">
                        <button
                          v-if="confirmCommentIndex !== i"
                          @click="confirmCommentIndex = i"
                          aria-label="Delete comment"
                          class="btn btn-link text-danger p-0"
                        >
                          <TrashIcon class="w-5 h-5" />
                        </button>
                        <div v-else class="flex items-center gap-1">
                          <span class="mr-1">Are you sure?</span>
                          <button @click="confirmDeleteComment(i)" aria-label="Confirm delete">
                            <CheckIcon class="w-5 h-5 text-success" />
                          </button>
                          <button @click="confirmCommentIndex = null" aria-label="Cancel delete">
                            <XMarkIcon class="w-5 h-5 text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p v-else>No comments found for this inmate.</p>
            </div>
          </div>
        </div>
        <BaseModal :show="showCommentModal" @close="closeCommentModal">
          <h3 class="h6 fw-semibold mb-2">New Comment</h3>
          <div class="mb-2">
            <label class="form-label mb-1">Author</label>
            <input v-model="commentAuthor" type="text" class="form-control" />
          </div>
          <div class="mb-2">
            <label class="form-label mb-1">Comment</label>
            <textarea v-model="commentBody" class="form-control" rows="3"></textarea>
          </div>
          <div class="mb-2 text-secondary">Date: {{ commentDate }}</div>
          <div class="d-flex justify-content-end gap-2">
            <button class="btn btn-secondary" @click="closeCommentModal">Cancel</button>
            <button class="btn btn-primary" @click="createComment">Save</button>
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
  deleteRequest,
  deleteComment,
  type Inmate,
} from '@/api'
import { TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/vue/24/solid'
import type { TableColumn } from '@/components/SimpleTable.vue'
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
const confirmRequestIndex = ref<number | null>(null)
const confirmCommentIndex = ref<number | null>(null)

watch(postmarkDate, (val) => setCookie('postmarkDate', val))

function createUrlAnchor(url: string | null | undefined, text?: string): string {
  if (!url) return text || ''
  const label =
    text ||
    (url.includes('tdcj.texas.gov') ? 'TDCJ Page' : url.includes('bop.gov') ? 'FBOP page' : url)
  return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`
}

const props = defineProps<{
  jurisdiction: string
  id: string
}>()

const inmateInfoColumns: TableColumn[] = [
  { key: 'id', label: 'Inmate ID' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'name', label: 'Name' },
  { key: 'race', label: 'Race' },
  { key: 'sex', label: 'Sex' },
  { key: 'release', label: 'Release' },
  { key: 'datetime_fetched', label: 'Fetched At' },
  { key: 'unit_name', label: 'Unit Name' },
]

const requestsTableColumns: TableColumn[] = [
  { key: 'date_postmarked', label: 'Date Postmarked' },
  { key: 'action', label: 'Action' },
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
    name: createUrlAnchor(
      inmate.value.url,
      `${inmate.value.first_name ?? ''} ${inmate.value.last_name ?? ''}`.trim(),
    ),
    race: inmate.value.race,
    sex: inmate.value.sex,
    release: inmate.value.release,
    datetime_fetched: inmate.value.datetime_fetched,
    unit_name: createUrlAnchor(inmate.value.unit?.url, inmate.value.unit?.name || ''),
  }
})

const inmateInfoList = computed(() => {
  const info = inmateInfoForTable.value as Record<string, unknown>
  return inmateInfoColumns.map((col) => ({
    label: col.label,
    value: info[col.key],
  }))
})

function sortRequests() {
  if (!inmate.value || !inmate.value.requests) return
  inmate.value.requests.sort(
    (a, b) => new Date(b.date_postmarked).getTime() - new Date(a.date_postmarked).getTime(),
  )
}

async function fetchDetails() {
  isLoading.value = true
  error.value = null
  try {
    inmate.value = await getInmateDetails(props.jurisdiction, props.id)
    sortRequests()
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
    sortRequests()
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

async function confirmDeleteRequest(idx: number) {
  if (!inmate.value || !inmate.value.requests) return
  try {
    const req = inmate.value.requests[idx]
    await deleteRequest(inmate.value.jurisdiction, inmate.value.id, req.index)
    inmate.value.requests.splice(idx, 1)
    sortRequests()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete request.'
    error.value = message
  } finally {
    confirmRequestIndex.value = null
  }
}

async function confirmDeleteComment(idx: number) {
  if (!inmate.value || !inmate.value.comments) return
  try {
    const cmt = inmate.value.comments[idx]
    await deleteComment(inmate.value.jurisdiction, inmate.value.id, cmt.index)
    inmate.value.comments.splice(idx, 1)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete comment.'
    error.value = message
  } finally {
    confirmCommentIndex.value = null
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
