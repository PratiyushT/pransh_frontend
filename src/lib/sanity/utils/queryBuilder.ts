import type {ProductFilterOptions} from "$lib";

export function buildProductsQuery(opts: ProductFilterOptions = {}) {
  const {
    page = 1,
    perPage = 12,
    search,
    categories,
    sizes,
    colors,
    minPrice,
    maxPrice,
    featuredOnly
  } = opts;

  // 1) Build WHERE clauses:
  const filters = ['_type == "product"'];
  if (featuredOnly) filters.push('isFeatured == true');
  if (search) filters.push(`(name match "${search}*" || description match "${search}*")`);
  if (categories?.length) {
    const list = categories.map(c => `"${c}"`).join(',');
    filters.push(`category->name in [${list}]`);
  }
  if (sizes?.length) {
    const list = sizes.map(s => `"${s}"`).join(',');
    filters.push(`count(variants[ size->name in [${list}] ]) > 0`);
  }
  if (colors?.length) {
    const list = colors.map(c => `"${c}"`).join(',');
    filters.push(`count(variants[ color->name in [${list}] ]) > 0`);
  }
  if (minPrice != null) filters.push(`count(variants[ price >= ${minPrice} ]) > 0`);
  if (maxPrice != null) filters.push(`count(variants[ price <= ${maxPrice} ]) > 0`);

  // 2) Calculate slice:
  const start = (page - 1) * perPage;
  const end   = start + perPage;
  const where = filters.join(' && ');
  const query = `
{
  "products": *[${where}]
    | order(_createdAt desc)[${start}...${end}] {
      _id,
      name,
      description,
      "slug": slug.current,
      "image": mainImage.asset->url,
      "category": category->{ _id, name },
      isFeatured,
      rating,
      "variants": variants[]->{
        _id, sku, price, stock,
        "images": images[].asset->url,
        "color": color->{ _id, name, hex },
        "size": size->{ _id, name }
      }
    },
  "totalCount": count(*[${where}])
}
`

  console.log("Query: ", query);
  return query;
}
