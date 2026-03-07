/**
 * TMF620 Product Catalog Management API Types
 *
 * Standards-compliant API response types for B2B partner integrations.
 * Maps CircleTel's internal data model to TMF620 schema.
 *
 * @see https://www.tmforum.org/resources/standard/tmf620-product-catalog-management-api-rest-specification-r19-0-0/
 */

// TMF620 Lifecycle States
export type TMF620LifecycleStatus =
  | 'In study'
  | 'In design'
  | 'In test'
  | 'Active'
  | 'Launched'
  | 'Retired'
  | 'Obsolete';

// TMF620 Time Period
export interface TMF620TimePeriod {
  startDateTime: string;  // ISO 8601
  endDateTime?: string;   // ISO 8601
}

// TMF620 Money
export interface TMF620Money {
  unit: string;   // Currency code (e.g., "ZAR")
  value: number;  // Amount
}

// TMF620 Quantity
export interface TMF620Quantity {
  amount: number;
  units: string;
}

// TMF620 Reference
export interface TMF620Reference {
  id: string;
  href: string;
  name?: string;
  '@referredType'?: string;
}

// TMF620 Category Reference
export interface TMF620CategoryRef extends TMF620Reference {
  version?: string;
}

// TMF620 Product Specification Reference
export interface TMF620ProductSpecificationRef extends TMF620Reference {
  version?: string;
  targetProductSchema?: {
    '@baseType'?: string;
    '@schemaLocation'?: string;
    '@type'?: string;
  };
}

// TMF620 Characteristic Value Specification
export interface TMF620CharacteristicValueSpec {
  isDefault?: boolean;
  rangeInterval?: string;
  regex?: string;
  unitOfMeasure?: string;
  valueFrom?: string;
  valueTo?: string;
  valueType?: string;
  validFor?: TMF620TimePeriod;
  value?: string | number | boolean;
}

// TMF620 Product Specification Characteristic
export interface TMF620ProductSpecCharacteristic {
  id?: string;
  name: string;
  description?: string;
  valueType?: string;
  configurable?: boolean;
  minCardinality?: number;
  maxCardinality?: number;
  isUnique?: boolean;
  regex?: string;
  extensible?: boolean;
  productSpecCharacteristicValue?: TMF620CharacteristicValueSpec[];
  validFor?: TMF620TimePeriod;
  '@type'?: string;
}

// TMF620 Product Offering Relationship
export interface TMF620ProductOfferingRelationship {
  id: string;
  href?: string;
  name?: string;
  relationshipType: 'addon' | 'requires' | 'excludes' | 'alternative' | 'includes';
  validFor?: TMF620TimePeriod;
  role?: string;
  '@type'?: string;
}

// TMF620 Price Alteration
export interface TMF620PriceAlteration {
  applicationDuration?: number;
  description?: string;
  name?: string;
  priceType?: string;
  priority?: number;
  recurringChargePeriod?: string;
  unitOfMeasure?: string;
  price?: TMF620Money;
  productOfferingPrice?: TMF620Reference;
  '@type'?: string;
}

// TMF620 Product Offering Price
export interface TMF620ProductOfferingPrice {
  id: string;
  href: string;
  name: string;
  description?: string;
  version?: string;
  priceType: 'recurring' | 'oneTime' | 'usage';
  recurringChargePeriodType?: 'day' | 'week' | 'month' | 'year';
  recurringChargePeriodLength?: number;
  isBundle?: boolean;
  lifecycleStatus?: TMF620LifecycleStatus;
  validFor?: TMF620TimePeriod;
  price: TMF620Money;
  unitOfMeasure?: TMF620Quantity;
  priceAlteration?: TMF620PriceAlteration[];
  productOfferingTerm?: TMF620ProductOfferingTerm[];
  '@type': 'ProductOfferingPrice';
}

// TMF620 Product Offering Term
export interface TMF620ProductOfferingTerm {
  name?: string;
  description?: string;
  duration?: TMF620Quantity;
  validFor?: TMF620TimePeriod;
  '@type'?: string;
}

// TMF620 Product Offering (Main Entity)
export interface TMF620ProductOffering {
  id: string;
  href: string;
  name: string;
  description?: string;
  version?: string;
  isBundle?: boolean;
  isSellable?: boolean;
  lifecycleStatus: TMF620LifecycleStatus;
  statusReason?: string;
  validFor?: TMF620TimePeriod;
  lastUpdate?: string;

  // References
  category?: TMF620CategoryRef[];
  productSpecification?: TMF620ProductSpecificationRef;
  productOfferingPrice?: TMF620ProductOfferingPrice[];
  productOfferingRelationship?: TMF620ProductOfferingRelationship[];
  productOfferingTerm?: TMF620ProductOfferingTerm[];
  prodSpecCharValueUse?: TMF620ProductSpecCharacteristic[];

  // Type discriminator
  '@type': 'ProductOffering';
  '@baseType'?: string;
  '@schemaLocation'?: string;
}

// TMF620 Category
export interface TMF620Category {
  id: string;
  href: string;
  name: string;
  description?: string;
  version?: string;
  isRoot?: boolean;
  lifecycleStatus?: TMF620LifecycleStatus;
  validFor?: TMF620TimePeriod;
  lastUpdate?: string;
  parentId?: string;
  productOffering?: TMF620Reference[];
  subCategory?: TMF620Reference[];
  '@type': 'Category';
}

// API Response Types
export interface TMF620PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  offset: number;
  limit: number;
  '@type': string;
}

export interface TMF620ErrorResponse {
  code: string;
  reason: string;
  message: string;
  status?: string;
  referenceError?: string;
  '@type': 'Error';
}

// Query Parameters
export interface TMF620ProductOfferingQuery {
  offset?: number;
  limit?: number;
  fields?: string;
  'lifecycleStatus'?: TMF620LifecycleStatus;
  'category.id'?: string;
  'productSpecification.id'?: string;
  'isBundle'?: boolean;
  'name'?: string;
}
