# Sanity: Function-Level Documentation

This document covers every module in **src/lib/sanity/**. For each file, the sections are:

1. **Purpose** – What the module does.
2. **File Path** – Location within the project.
3. **Imports** – External modules and utilities used.
4. **Exports** – Constants and functions exported.
5. **Functions** – Detailed signature, description, parameters, return values, and example usage.
6. **Flow** – ASCII diagram showing the module’s operational flow.

---

## client.ts

**Purpose:**
Instantiates and exports a configured Sanity client for use across data-fetching modules.

**File Path:**
`src/lib/sanity/client.ts`

### Imports
```js
import { createClient, type SanityClient } from '@sanity/client';
import { PUBLIC_SANITY_PROJECT_ID, PUBLIC_SANITY_DATASET } from '$env/static/public';
```

### Exports
```ts
export const sanityClient: SanityClient;
```

### Functions / Initialization
```ts
export const sanityClient: SanityClient = createClient({
  projectId: PUBLIC_SANITY_PROJECT_ID,
  dataset: PUBLIC_SANITY_DATASET,
  useCdn: true,
  apiVersion: '2023-01-01'
});
```
- **Description:** Calls `createClient` with environment-driven config to produce a reusable client.
- **Parameters:**
  - `projectId` (string)
  - `dataset` (string)
  - `useCdn` (boolean)
  - `apiVersion` (string)
- **Returns:** `SanityClient`

### Flow
```
Read env vars
   |
createClient(config)
   |
Export sanityClient
```

---

## queries.ts

**Purpose:**
Defines reusable GROQ query strings and helper functions to fetch specific datasets from Sanity.

**File Path:**
`src/lib/sanity/queries.ts`

### Imports
_None_

### Exports
```ts
export const allFeaturedProductsQuery: string;
export const allCategoriesQuery: string;
export const allColorsQuery: string;
export const allSizesQuery: string;
export function paginatedProductsQuery(page: number, perPage: number): string;
export function singleProductQuery(id: string): string;
```

### Functions

1. **paginatedProductsQuery(page, perPage)**
   - **Signature:** `(page: number, perPage: number) => string`
   - **Description:** Builds a GROQ slice for pagination: selects items from `(page-1)*perPage` to `page*perPage`.
   - **Parameters:**
     - `page` (1-based index)
     - `perPage` (items per page)
   - **Returns:** GROQ query string
   - **Example:**
     ```js
     paginatedProductsQuery(2, 10);
     // => '*[_type == "product"][10...20]{...}'
     ```

2. **singleProductQuery(id)**
   - **Signature:** `(id: string) => string`
   - **Description:** Generates a GROQ query to fetch a single product by its document ID.
   - **Parameters:**
     - `id` (string)
   - **Returns:** GROQ query string
   - **Example:**
     ```js
     singleProductQuery('abc123');
     // => '*[_type == "product" && _id == "abc123"][0]{...}'
     ```

### Static Queries
```ts
export const allFeaturedProductsQuery =
  '*[_type == "product" && featured == true]{ ..., variants[]{ ..., image{ asset->{ url } } } }';
export const allCategoriesQuery =
  '*[_type == "category"]{ name, slug }';
export const allColorsQuery =
  '*[_type == "color"]{ name, hex }';
export const allSizesQuery =
  '*[_type == "size"]{ name }';
```
- **allFeaturedProductsQuery**: Fetches all products with `featured == true`, including nested `variants` and their `image` URLs.
- **allCategoriesQuery**: Retrieves all category documents, returning `name` and `slug` fields.
- **allColorsQuery**: Retrieves all color documents, returning `name` and hexadecimal `hex` values.
- **allSizesQuery**: Retrieves all size documents, returning the `name` of each size.

### Flow
```
Import queries or functions
   |
Optionally call paginatedProductsQuery / singleProductQuery
   |
Use returned string in sanityClient.fetch(query)
```

---

## queryBuilder.ts

**Purpose:**
Constructs dynamic GROQ queries for products based on filter criteria and pagination.

**File Path:**
`src/lib/sanity/queryBuilder.ts`

### Imports
```ts
import {
  paginatedProductsQuery,
  allFeaturedProductsQuery
} from './queries';
```

### Exports
```ts
export function buildProductQuery(filters: {
  categories?: string[];
  sizes?: string[];
  colors?: string[];
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  perPage?: number;
}): string;
```

### Functions

1. **buildProductQuery(filters)**
   - **Signature:** `(filters: Filters) => string`
   - **Description:** Combines filter conditions into a GROQ query and applies optional pagination slice.
   - **Parameters:**
     - `filters.categories` (string[])
     - `filters.sizes` (string[])
     - `filters.colors` (string[])
     - `filters.minPrice` (number, cents)
     - `filters.maxPrice` (number, cents)
     - `filters.page` (number)
     - `filters.perPage` (number)
   - **Returns:** Complete GROQ query string
   - **Example:**
     ```js
     buildProductQuery({ categories: ['Men'], minPrice: 5000, page: 1, perPage: 8 });
     // => '*[_type=="product" && category->name in ['Men'] && price >= 5000][0...8]{...}'
     ```

### Flow
```
Receive filters object
   |
Build array of condition strings
   |
If pagination given, obtain slice via paginatedProductsQuery
   |
Concatenate conditions, projections, and slice
   |
Return resulting GROQ string
```

---

## homepage.ts

**Purpose:**
Defines a composite GROQ query to fetch homepage data (hero, featured products, categories) in one call.

**File Path:**
`src/lib/sanity/homepage.ts`

### Imports
_None_

### Exports
```ts
export const homepageQuery: string;
```

### Static Query
```groq
export const homepageQuery = `{
  "hero": *[_type=="hero"][0],
  "featured": ${allFeaturedProductsQuery},
  "categories": ${allCategoriesQuery}
}`;
```
- **Description:** Aggregates multiple data sets (hero, featured, categories) into a structured JSON response.

### Flow
```
Export homepageQuery string
   |
Use in sanityClient.fetch(homepageQuery)
```

---

## homepageData.server.ts

**Purpose:**
Server-side loader that fetches homepage data using the configured Sanity client and returns it for page rendering.

**File Path:**
`src/lib/sanity/homepageData.server.ts`

### Imports
```ts
import { sanityClient } from './client';
import { homepageQuery } from './homepage';
```

### Exports
```ts
export async function loadHomepageData(): Promise<{
  hero: any;
  featured: any[];
  categories: any[];
}>;
```

### Functions

1. **loadHomepageData()**
   - **Signature:** `() => Promise<{ hero: any; featured: any[]; categories: any[] }>`
   - **Description:** Executes `homepageQuery` via `sanityClient.fetch`, returns fetched data or a fallback empty structure on error.
   - **Parameters:** None
   - **Returns:** Object containing
     - `hero` (any)
     - `featured` (array)
     - `categories` (array)
   - **Example:**
     ```js
     const data = await loadHomepageData();
     console.log(data.hero, data.featured.length);
     ```

### Flow
```
Call loadHomepageData()
   |
sanityClient.fetch(homepageQuery)
   |
Return fetched data or fallback
```

---

## queriesTransform.ts

**Purpose:**
Provides high-level, typed functions to fetch and transform various data models (categories, products, colors, sizes) from Sanity.

**File Path:**
`src/lib/sanity/queriesTransform.ts`

### Imports
```ts
import { sanityClient } from './client';
import * as queries from './queries';
import type {
  Category, Color, Size, Product, Variant, Image
} from '$lib/types';
```

### Exports
```ts
export function transformSanityProduct(raw: any): Product;
export async function getCategories(): Promise<Category[]>;
export async function getSizes(): Promise<Size[]>;
export async function getColors(): Promise<Color[]>;
export async function getProducts(): Promise<Product[]>;
export async function getFeaturedProducts(): Promise<Product[]>;
export async function getProductsByCategory(
  name: string
): Promise<Product[]>;
export async function getProductById(
  id: string
): Promise<Product | undefined>;
export async function getRandomProducts(
  count: number
): Promise<Product[]>;
export function formatPrice(price: number): string;
```

### Functions

1. **transformSanityProduct(raw)**
   - **Signature:** `(raw: any) => Product`
   - **Description:** Converts a raw Sanity document into the typed `Product` interface, providing defaults and extracting nested variants and images.
   - **Parameters:**
     - `raw` (object)
   - **Returns:** `Product`
   - **Example:**
     ```js
     const product = transformSanityProduct(rawDoc);
     console.log(product.id, product.variants.length);
     ```

2. **getCategories()**
   - **Signature:** `() => Promise<Category[]>`
   - **Description:** Fetches category documents using `allCategoriesQuery`, maps to `Category[]`.

3. **getSizes(), getColors()**
   - **Signature:** `() => Promise<Size[]> | Promise<Color[]>`
   - **Description:** Similar to `getCategories`, fetches sizes or colors.

4. **getProducts()**
   - **Signature:** `() => Promise<Product[]>`
   - **Description:** Retrieves all products via `paginatedProductsQuery` without slice.

5. **getFeaturedProducts()**
   - **Signature:** `() => Promise<Product[]>`
   - **Description:** Uses `allFeaturedProductsQuery`, transforms results into `Product[]`.

6. **getProductsByCategory(name)**
   - **Signature:** `(name: string) => Promise<Product[]>`
   - **Description:** Filters products by a given category name, transforms results.

7. **getProductById(id)**
   - **Signature:** `(id: string) => Promise<Product | undefined>`
   - **Description:** Fetches a single product by ID; returns `undefined` if not found.

8. **getRandomProducts(count)**
   - **Signature:** `(count: number) => Promise<Product[]>`
   - **Description:** Fetches all products, shuffles the list, returns the first `count` items.
   - **Example:**
     ```js
     const randoms = await getRandomProducts(3);
     console.log(randoms.length === 3);
     ```

9. **formatPrice(price)**
   - **Signature:** `(price: number) => string`
   - **Description:** Converts a price in cents to a USD formatted string (e.g. 1999 → "$19.99").
   - **Example:**
     ```js
     formatPrice(1999); // "$19.99"
     ```

### Flow
```
Consumer calls e.g. getProducts()
   |
sanityClient.fetch(queries.paginatedProductsQuery(...))
   |
Map raw results with transformSanityProduct()
   |
Return typed array
```

---

*End of documentation for `src/lib/sanity`.*

