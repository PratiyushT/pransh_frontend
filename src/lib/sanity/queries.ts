// Get all categories
export const allCategoriesQuery = `
  *[_type == "category"] | order(name asc) {
  _id,
  name,
  image {
    asset->{
      url
    }
  }
}
`

// Get all colors
export const allColorsQuery = `
*[_type == "color"] | order(name asc) {
  _id,
  name,
  hex
}
`
  // Get all feature
  export const allFeaturedProductsQuery = `
  *[_type == "product" && isFeatured == true] | order(_createdAt desc) {
    _id,
    name,
    description,
    "slug": slug.current,
    "image": mainImage.asset->url,
    rating,
    isFeatured,
    category->{
      _id,
      name
    },
    "variants": variants[]->{
      _id,
      sku,
      price,
      stock,
      "color": color->{
        _id,
        name,
        hex
      },
      "size": size->{
        _id,
        name
      },
      "images": images[].asset->url
    }
  }
`

// Get all sizes
export const allSizesQuery = `
*[_type == "size"] | order(name asc) {
  _id,
  name
}
`

// Count Total Products
export const totalProductCountQuery = 'count(*[_type == "product"])'

// Get paginated products
export const paginatedProductsQuery = (start: number, end: number) => `
  *[_type == "product"] | order(_createdAt desc) [${start}...${end}] {
    _id,
    name,
    description,
    price,
    category->{
      _id,
      name
    },
    colors[]->{
      _id,
      name,
      hex
    },
    images[]{
      asset->{
        url
      }
    }
  }
`

// Get single product by its slug. 
export const singleProductBySlugQuery = (slug: string) => `
  *[_type == "product" && slug.current == "${slug}"] {
    _id,
    name,
    description,
    price,
    category->{
      _id,
      name
    },
    colors[]->{
      _id,
      name,
      hex
    },
    images[]{
      asset->{
        url
      }
    }
  }[0]
`
