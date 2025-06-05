const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Define interfaces based on your FastAPI schemas (simplified examples)
export interface Inmate {
  id: string
  jurisdiction: string
  first_name: string
  last_name: string
  date_of_birth?: string
  // Add other inmate fields as defined in your schemas.Unit
  unit?: { name: string; jurisdiction: string } // Simplified Unit
  requests?: InmateRequest[]
  comments?: InmateComment[]
  [key: string]: any // Allow other properties
}

export interface InmateRequest {
  index: number
  date_postmarked: string
  // Add other request fields
  [key: string]: any
}

export interface InmateComment {
  index: number
  text: string
  datetime_created: string
  // Add other comment fields
  [key: string]: any
}

export interface InmateSearchResults {
  inmates: Inmate[]
  errors: any[]
}

export interface Unit {
  id?: string // Assuming unit might have an ID
  name: string
  jurisdiction: string
  address?: string
  // Add other unit fields
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
