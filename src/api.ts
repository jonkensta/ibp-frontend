const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Enumerations from the API schema
export type Jurisdiction = 'Texas' | 'Federal'
export type Action = 'Filled' | 'Tossed'
export type ShippingMethod = 'Box' | 'Individual'

// Interfaces based on the FastAPI schemas
export interface Lookup {
  datetime_created: string
}

export interface InmateRequest {
  index: number
  date_postmarked: string
  date_processed: string
  action: Action
  status: string
}

export interface RequestCreate {
  date_postmarked: string
  date_processed: string
  action: Action
}

export interface InmateComment {
  index: number
  body: string
  author: string
  datetime_created: string
}

export interface CommentCreate {
  body: string
  author: string
  datetime_created: string
}

export interface Unit {
  name: string
  jurisdiction: Jurisdiction
  street1: string
  street2?: string | null
  city: string
  zipcode: string
  state: string
  url?: string | null
  shipping_method?: ShippingMethod | null
}

export interface UnitUpdate {
  name?: string | null
  street1?: string | null
  street2?: string | null
  city?: string | null
  zipcode?: string | null
  state?: string | null
  url?: string | null
  jurisdiction?: Jurisdiction | null
  shipping_method?: ShippingMethod | null
}

export interface Inmate {
  first_name?: string | null
  last_name?: string | null
  jurisdiction: Jurisdiction
  id: number
  race?: string | null
  sex?: string | null
  release?: string | null
  url?: string | null
  datetime_fetched?: string | null
  unit: Unit
  requests?: InmateRequest[]
  comments?: InmateComment[]
  lookups?: Lookup[]
}

export interface InmateSearchResult {
  first_name?: string | null
  last_name?: string | null
  jurisdiction: Jurisdiction
  id: number
  race?: string | null
  sex?: string | null
  release?: string | null
  url?: string | null
}

export interface InmateSearchResults {
  inmates: InmateSearchResult[]
  errors: string[]
}

async function fetchAPI(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, options)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }
  if (response.status === 204) {
    return
  }
  return response.json()
}

export async function searchInmates(query: string): Promise<InmateSearchResults> {
  return fetchAPI(`/inmates?query=${encodeURIComponent(query)}`)
}

export async function getInmateDetails(jurisdiction: string, inmateId: string): Promise<Inmate> {
  return fetchAPI(`/inmates/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(inmateId)}`)
}

export async function getAllUnits(): Promise<Unit[]> {
  return fetchAPI('/units')
}

export async function getUnitDetails(jurisdiction: string, name: string): Promise<Unit> {
  return fetchAPI(`/units/${jurisdiction}/${encodeURIComponent(name)}`)
}

export async function addRequest(
  jurisdiction: string,
  inmateId: number,
  data: RequestCreate,
): Promise<InmateRequest> {
  return fetchAPI(`/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteRequest(
  jurisdiction: string,
  inmateId: number,
  requestIndex: number,
): Promise<void> {
  await fetchAPI(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/requests/${requestIndex}`,
    { method: 'DELETE' },
  )
}

export async function addComment(
  jurisdiction: string,
  inmateId: number,
  data: CommentCreate,
): Promise<InmateComment> {
  return fetchAPI(`/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export async function deleteComment(
  jurisdiction: string,
  inmateId: number,
  commentIndex: number,
): Promise<void> {
  await fetchAPI(
    `/inmates/${encodeURIComponent(jurisdiction)}/${inmateId}/comments/${commentIndex}`,
    { method: 'DELETE' },
  )
}

export async function updateUnit(
  jurisdiction: string,
  name: string,
  data: UnitUpdate,
): Promise<Unit> {
  return fetchAPI(`/units/${encodeURIComponent(jurisdiction)}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}
