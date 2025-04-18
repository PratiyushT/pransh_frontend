 // src/routes/+page.server.ts
import type { PageServerLoad } from './$types'
import { fetchHomepageData } from './server'


export const load: PageServerLoad = async () => {
  // runs only on the server
  return fetchHomepageData()
}
