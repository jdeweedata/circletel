// Note: Since Strapi might not be running, we'll create a mock client for now
// This allows the app to work without requiring a running Strapi instance

interface StrapiClientInterface {
  get: <T = unknown>(collection: string, query?: Record<string, unknown>) => Promise<T>
  find: (collection: string, query?: Record<string, unknown>) => Promise<unknown>
  findOne: (collection: string, id: string | number, query?: Record<string, unknown>) => Promise<unknown>
  create: (collection: string, data: Record<string, unknown>) => Promise<unknown>
  update: (collection: string, id: string | number, data: Record<string, unknown>) => Promise<unknown>
  delete: (collection: string, id: string | number) => Promise<unknown>
}

const mockStrapi: StrapiClientInterface = {
  get: async <T = unknown>(collection: string, query?: Record<string, unknown>): Promise<T> => {
    console.log(`Mock Strapi: get ${collection}`, query)
    return { data: [], meta: { pagination: { total: 0 } } } as T
  },
  find: async (collection: string, query?: Record<string, unknown>) => {
    console.log(`Mock Strapi: find ${collection}`, query)
    return { data: [], meta: { pagination: { total: 0 } } }
  },
  findOne: async (collection: string, id: string | number, query?: Record<string, unknown>) => {
    console.log(`Mock Strapi: findOne ${collection}/${id}`, query)
    return { data: null }
  },
  create: async (collection: string, data: Record<string, unknown>) => {
    console.log(`Mock Strapi: create ${collection}`, data)
    const dataObj = data as { data?: Record<string, unknown> }
    return {
      data: {
        id: Math.floor(Math.random() * 1000),
        documentId: `doc_${Math.random().toString(36).substr(2, 9)}`,
        ...(dataObj.data || {})
      }
    }
  },
  update: async (collection: string, id: string | number, data: Record<string, unknown>) => {
    console.log(`Mock Strapi: update ${collection}/${id}`, data)
    const dataObj = data as { data?: Record<string, unknown> }
    return { data: { id, ...(dataObj.data || {}) } }
  },
  delete: async (collection: string, id: string | number) => {
    console.log(`Mock Strapi: delete ${collection}/${id}`)
    return { data: { id } }
  }
}

export const strapi = mockStrapi
export const strapiClient = mockStrapi
export default strapi