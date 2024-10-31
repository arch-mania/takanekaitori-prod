// Contentful System Fields
interface ContentfulSys {
  id: string;
  [key: string]: any;
}

// Base Contentful Entry
interface ContentfulEntry<T> {
  sys: ContentfulSys;
  fields: T;
}

// Region Type
export interface Region {
  id: string;
  name: string;
  order?: number;
  area: string;
}

// Property Related Types
export interface PropertyFields {
  title: string;
  address: string;
  rent?: number;
  pricePerTsubo?: number;
  floorArea?: number;
  floorAreaTsubo?: number;
  stationName1?: string;
  walkingTimeToStation?: number;
  exteriorImages?: Array<{
    fields: {
      file: {
        url: string;
      };
    };
  }>;
  isNew: boolean;
  isSkeleton: boolean;
  isInteriorIncluded: boolean;
  securityDeposit?: string;
  regions?: ContentfulEntry<Region>[];
}

export interface Property {
  id: string;
  title: string;
  address: string;
  price: string;
  size: string;
  distance: string;
  image: string;
  isNew: boolean;
  isSkeleton: boolean;
  isInteriorIncluded: boolean;
  isFavorite: boolean;
  details: PropertyDetailItem[];
  regions?: Region[];
}

// Station Related Types
export interface StationFields {
  name: string;
  popularityOrder: number;
  area?: {
    fields: {
      name: string;
    };
  };
}

export interface Station {
  id: string;
  name: string;
  popularityOrder: number;
  area: {
    fields: {
      name: string;
    };
  };
}

// Property Detail Types
export interface PropertyDetail {
  id: string;
  title: string;
  address: string;
  distance: string;
  size: string;
  rent: number;
  pricePerTsubo: number;
  floorArea: number;
  floorAreaTsubo: number;
  interiorTransferFee: string;
  allowedRestaurantTypes: string[];
  notes: string;
  comment: string;
  images: string[];
  badges: PropertyBadge[];
  details: PropertyDetailItem[];
  isWatermarkEnabled: boolean;
}

export interface PropertyBadge {
  text: string;
  variant: string;
}

export interface PropertyDetailItem {
  label: string;
  value: string;
}

// Loader Data Interface
export interface LoaderData {
  properties: Property[];
  popularStations: Station[];
  totalCount: number;
  newCount: number;
  areaName: string;
  searchRegions: {
    id: string;
    name: string;
    order: number;
    area: string;
  }[];
}

export interface FilterState {
  minRent: string;
  maxRent: string;
  minArea: string;
  maxArea: string;
  isSkeleton: boolean;
  isInteriorIncluded: boolean;
  isNew: boolean;
  floors: {
    basement: boolean;
    first: boolean;
    second: boolean;
    thirdAndAbove: boolean;
    multiFloorWithFirst: boolean;
    multiFloorWithoutFirst: boolean;
  };
  regions: string[];
  stations: string[];
  allowedRestaurantTypes: string[];
  keyword: string;
  walkingTime: string;
}
