// Note: Since Strapi might not be running, we'll create a mock client for now
// This allows the app to work without requiring a running Strapi instance

interface StrapiClientInterface {
  get: <T = any>(collection: string, query?: any) => Promise<T>
  find: (collection: string, query?: any) => Promise<any>
  findOne: (collection: string, id: string | number, query?: any) => Promise<any>
  create: (collection: string, data: any) => Promise<any>
  update: (collection: string, id: string | number, data: any) => Promise<any>
  delete: (collection: string, id: string | number) => Promise<any>
}

const mockStrapi: StrapiClientInterface = {
  get: async <T = any>(collection: string, query?: any): Promise<T> => {
    console.log(`Mock Strapi: get ${collection}`, query)
    return { data: [], meta: { pagination: { total: 0 } } } as T
  },
  find: async (collection: string, query?: any) => {
    console.log(`Mock Strapi: find ${collection}`, query)
    return { data: [], meta: { pagination: { total: 0 } } }
  },
  findOne: async (collection: string, id: string | number, query?: any) => {
    console.log(`Mock Strapi: findOne ${collection}/${id}`, query)
    return { data: null }
  },
  create: async (collection: string, data: any) => {
    console.log(`Mock Strapi: create ${collection}`, data)
    return {
      data: {
        id: Math.floor(Math.random() * 1000),
        documentId: `doc_${Math.random().toString(36).substr(2, 9)}`,
        ...data.data
      }
    }
  },
  update: async (collection: string, id: string | number, data: any) => {
    console.log(`Mock Strapi: update ${collection}/${id}`, data)
    return { data: { id, ...data.data } }
  },
  delete: async (collection: string, id: string | number) => {
    console.log(`Mock Strapi: delete ${collection}/${id}`)
    return { data: { id } }
  }
}

export const strapi = mockStrapi
export const strapiClient = mockStrapi
export default strapi