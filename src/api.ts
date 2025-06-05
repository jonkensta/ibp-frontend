const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Define interfaces based on your FastAPI schemas
export interface Inmate {
  id: number
  jurisdiction: string
  first_name: string
  last_name: string
  race?: string
  sex?: string
  release?: string | Date
  url?: string
  datetime_fetched?: string
  unit?: Unit
  requests?: InmateRequest[]
  comments?: InmateComment[]
  [key: string]: any // Allow other properties
}

export interface InmateRequest {
  index: number
  date_postmarked: string
  date_processed: string
  action: string
  status: string
  [key: string]: any
}

export interface InmateComment {
  index: number
  body: string
  author: string
  datetime_created: string
  [key: string]: any
}

export interface InmateSearchResults {
  inmates: Inmate[]
  errors: any[]
}

export interface Unit {
  name: string
  jurisdiction: string
  street1: string
  street2?: string
  city: string
  zipcode: string
  state: string
  url?: string
  shipping_method?: string
  [key: string]: any
}

async function fetchAPI(url: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${url}`, options)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: response.statusText }))
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export async function searchInmates(query: string): Promise<InmateSearchResults> {
  return fetchAPI(`/inmates?query=${encodeURIComponent(query)}`)
}

export async function getInmateDetails(jurisdiction: string, inmateId: string): Promise<Inmate> {
  return fetchAPI(`/inmates/${jurisdiction}/${inmateId}`)
}

export async function getAllUnits(): Promise<Unit[]> {
  return fetchAPI('/units')
}

export async function getUnitDetails(jurisdiction: string, name: string): Promise<Unit> {
  return fetchAPI(`/units/${jurisdiction}/${encodeURIComponent(name)}`)
}
