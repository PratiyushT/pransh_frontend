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
`;

// Get all colors
export const allColorsQuery = `
*[_type == "color"] | order(name asc) {
  _id,
  name,
  hex
}
`;

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
`;

// Get all sizes
export const allSizesQuery = `
*[_type == "size"] | order(name asc) {
  _id,
  name
}
`;

// Count Total Products
export const totalProductCountQuery = 'count(*[_type == "product"])';

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
`;

// Get single product by its slug.
export const singleProductBySlugQuery = (slug: string) => `
  *[_type == "product" && slug.current == "${slug}"][0] {
    _id,
    name,
    description,
    "slug": slug.current,
    rating,
    isFeatured,
    "category": category->{
      _id,
      name
    },
    "variants": variants[]-> {
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
`;

// Get single product by ID
export const singleProductByIdQuery = (id: string) => `
  *[_type == "product" && _id == "${id}"][0] {
    _id,
    name,
    description,
    "slug": slug.current,
    rating,
    isFeatured,
    "category": category->{
      _id,
      name
    },
    "variants": variants[]-> {
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
`;

// Get Products in cart page.
// ProductIds and VariantIds needs to be passed as param.
export const cartProductsQuery = `
*[
  _type == "product" &&
  _id in $productIds
]{
  "productId": _id,
  "productName": name,
  "variants": variants[_ref in $variantIds]->{
    _id,
    sku,
    price,
    stock,
    "color": color->{ _id, name, hex },
    "size": size->{ _id, name },
    "images": images[].asset->url,
    "productId": ^._id,
    "productName": ^.name
  }
}[].variants[]
`;
