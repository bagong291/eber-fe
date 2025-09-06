/**
 * Utilities for handling URL query parameters in a clean, RESTful way
 */

export interface QueryParams {
  [key: string]: string | number | boolean | string[] | number[] | undefined
}

/**
 * Build clean query string from parameters
 * Arrays are converted to comma-separated values
 * 
 * @example
 * buildQueryString({
 *   search: 'paint',
 *   type: ['Solvent-Based', 'Water-Based'],
 *   page: 1
 * })
 * // Returns: "search=paint&type=Solvent-Based,Water-Based&page=1"
 */
export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return // Skip empty values
    }
    
    if (Array.isArray(value)) {
      if (value.length > 0) {
        // Join array values with commas
        searchParams.append(key, value.join(','))
      }
    } else {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

/**
 * Parse comma-separated query parameter back to array
 * 
 * @example
 * parseCommaSeparated("Solvent-Based,Water-Based")
 * // Returns: ["Solvent-Based", "Water-Based"]
 */
export function parseCommaSeparated(value: string | undefined): string[] {
  if (!value || typeof value !== 'string') return []
  return value.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Build full URL with clean query parameters
 */
export function buildApiUrl(baseUrl: string, params: QueryParams): string {
  const queryString = buildQueryString(params)
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}
