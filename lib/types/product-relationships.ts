/**
 * Product Relationships Types
 *
 * TMF620 ProductOfferingRelationship implementation for CircleTel's
 * Base + Modules pricing model (add-ons, prerequisites, exclusions).
 *
 * @see /products/smb/skyfibre/SkyFibre_SMB_v2_Commercial_Product_Specification.md
 */

export type ProductRelationshipType =
  | 'addon'        // Optional add-on module
  | 'requires'     // Prerequisite (must have)
  | 'excludes'     // Mutually exclusive
  | 'alternative'  // Can substitute
  | 'includes';    // Bundle component (included in price)

export interface ProductRelationship {
  id: string;
  source_product_id: string;
  target_product_id: string;
  relationship_type: ProductRelationshipType;
  is_mandatory: boolean;
  min_quantity: number;
  max_quantity: number;
  price_modifier: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/** ProductRelationship with joined target product details */
export interface ProductRelationshipWithTarget extends ProductRelationship {
  target_product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  };
}

/** ProductRelationship with joined source product details */
export interface ProductRelationshipWithSource extends ProductRelationship {
  source_product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  };
}

/** Product with all its relationships grouped by type */
export interface ProductWithRelationships {
  product: {
    id: string;
    name: string;
    slug: string;
    category: string;
    status: string;
  };
  addons: ProductRelationshipWithTarget[];
  prerequisites: ProductRelationshipWithTarget[];
  exclusions: ProductRelationshipWithTarget[];
  alternatives: ProductRelationshipWithTarget[];
  bundleComponents: ProductRelationshipWithTarget[];
}

/** Input for creating a new product relationship */
export interface CreateProductRelationshipInput {
  source_product_id: string;
  target_product_id: string;
  relationship_type: ProductRelationshipType;
  is_mandatory?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  price_modifier?: number | null;
  sort_order?: number;
}

/** Input for updating an existing product relationship */
export interface UpdateProductRelationshipInput {
  is_mandatory?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  price_modifier?: number | null;
  sort_order?: number;
}
