import { client } from '$lib/sanity/client';
import type { CartItem } from '$lib/types';

/**
 * Validate a single cart item against Sanity data
 *
 * @param item The cart item to validate
 * @param strictValidation Whether to strictly validate stock (e.g. for checkout)
 * @returns true if the item is valid, false otherwise
 */
export async function validateCartItem(
  item: CartItem,
  strictValidation: boolean = false
): Promise<boolean> {
  try {
    if (!item || !item.productId || !item.variantId || item.quantity <= 0) {
      return false;
    }

    // Query Sanity for the product and variant
    const query = `
      *[_type == "product" && _id == $productId][0] {
        _id,
        name,
        "variants": *[_type == "variant" && references(^._id) && _id == $variantId][0] {
          _id,
          sku,
          price,
          stock
        }
      }
    `;

    const params = {
      productId: item.productId,
      variantId: item.variantId
    };

    const product = await client.fetch(query, params);

    // Check if product exists
    if (!product || !product._id) {
      console.warn(`Product not found: ${item.productId}`);
      return false;
    }

    // Check if variant exists
    if (!product.variants || !product.variants._id) {
      console.warn(`Variant not found: ${item.variantId} for product ${item.productId}`);
      return false;
    }

    // Check stock level if strict validation is enabled
    if (strictValidation) {
      const variant = product.variants;

      // Stock must be defined and sufficient
      if (typeof variant.stock !== 'number' || variant.stock < item.quantity) {
        console.warn(`Insufficient stock for ${product.name}: Available=${variant.stock || 0}, Requested=${item.quantity}`);
        return false;
      }
    } else {
      // For non-strict validation, just check if stock exists and is greater than 0
      const variant = product.variants;
      if (typeof variant.stock !== 'number' || variant.stock <= 0) {
        console.warn(`Item out of stock: ${product.name}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating cart item:', error);
    // In case of an error, default to allowing the item if not strict validation
    return !strictValidation;
  }
}

/**
 * Validate multiple cart items against Sanity data
 *
 * @param items The cart items to validate
 * @param strictValidation Whether to strictly validate stock (e.g. for checkout)
 * @returns Array of valid cart items
 */
export async function validateCartItems(
  items: CartItem[],
  strictValidation: boolean = false
): Promise<CartItem[]> {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }

  try {
    // First, fetch all products and variants in one request for efficiency
    const productIds = [...new Set(items.map(item => item.productId))];
    const variantIds = [...new Set(items.map(item => item.variantId))];

    const batchQuery = `{
      "products": *[_type == "product" && _id in $productIds] {
        _id,
        name
      },
      "variants": *[_type == "variant" && _id in $variantIds] {
        _id,
        stock,
        "productId": *[_type == "product" && references(^._id)][0]._id
      }
    }`;

    const batchParams = {
      productIds,
      variantIds
    };

    const batchResult = await client.fetch(batchQuery, batchParams);

    // Create maps for quick lookups
    const productMap = new Map();
    if (batchResult.products) {
      batchResult.products.forEach(product => {
        productMap.set(product._id, product);
      });
    }

    const variantMap = new Map();
    if (batchResult.variants) {
      batchResult.variants.forEach(variant => {
        variantMap.set(variant._id, variant);
      });
    }

    // Filter valid items
    const validItems: CartItem[] = [];

    for (const item of items) {
      // Check if product exists
      const product = productMap.get(item.productId);
      if (!product) {
        console.warn(`Product not found: ${item.productId}`);
        continue;
      }

      // Check if variant exists
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        console.warn(`Variant not found: ${item.variantId}`);
        continue;
      }

      // Check if variant belongs to the product
      if (variant.productId !== item.productId) {
        console.warn(`Variant ${item.variantId} does not belong to product ${item.productId}`);
        continue;
      }

      // Check stock level if strict validation is enabled
      if (strictValidation) {
        // Stock must be defined and sufficient
        if (typeof variant.stock !== 'number' || variant.stock < item.quantity) {
          console.warn(`Insufficient stock for ${product.name}: Available=${variant.stock || 0}, Requested=${item.quantity}`);
          continue;
        }
      } else {
        // For non-strict validation, just check if stock exists and is greater than 0
        if (typeof variant.stock !== 'number' || variant.stock <= 0) {
          console.warn(`Item out of stock: ${product.name}`);
          continue;
        }
      }

      // All checks passed, add to valid items
      validItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      });
    }

    return validItems;
  } catch (error) {
    console.error('Error validating cart items:', error);

    // In case of an error, return all items if not strict validation
    return strictValidation ? [] : [...items];
  }
}
