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

// Get single product
export const singleProductQuery = (id: string) => `
  *[_type == "product" && _id == "${id}"] {
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

// Search products
export const searchProductsQuery = (start: number, end: number, searchTerm: string) => `
  *[_type == "product" && (
    name match "${searchTerm}*" ||
    description match "${searchTerm}*"
  )] | order(_createdAt desc) [${start}...${end}] {
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



// Get products by category
export const categoryProductsQuery = (start: number, end: number, categoryId: string) => `
  *[_type == "product" && category._ref == "${categoryId}"] | order(_createdAt desc) [${start}...${end}] {
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