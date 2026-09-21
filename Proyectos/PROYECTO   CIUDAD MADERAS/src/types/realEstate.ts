export type LotStatus = 'disponible' | 'apartado' | 'vendido' | 'proximamente';

export interface LotCoordinates {
  x: number; // percentage in masterplan (0 - 100)
  y: number; // percentage in masterplan (0 - 100)
  polygon?: [number, number][]; // optional SVG polygon points
}

export interface Lot {
  id: string;
  number: number;
  privadaId: number;
  privadaName: string;
  stage: string;
  status: LotStatus;
  surfaceM2: number;
  type: 'Residencial' | 'Comercial' | 'Premium';
  orientation: 'Norte' | 'Sur' | 'Este' | 'Oeste' | 'Nor-Oriente' | 'Sur-Poniente';
  shape: 'Regular' | 'Irregular' | 'Esquina';
  image: string;
  coords: LotCoordinates;
  recommendedHouseModelId?: string;
  isDemo?: boolean;
}

export interface Privada {
  id: number;
  number: number;
  name: string;
  stage: number;
  lotCount: number;
  availableCount: number;
  coords: { x: number; y: number };
}

export interface Amenity {
  id: string;
  name: string;
  tag: string;
  category: 'club' | 'parque' | 'verde' | 'comercial' | 'acceso';
  icon: string;
  description: string;
  image: string;
  coords: { x: number; y: number };
  pinColor: string;
  accentColor: string;
  features: string[];
}

export interface HousingRoom {
  id: string;
  name: string;
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  description: string;
}

export interface HousingModel {
  id: string;
  name: string;
  slogan: string;
  surfaceM2: number;
  levels: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  description: string;
  thumbnail: string;
  modelGlb: string;
  category: 'Residencial' | 'Premium' | 'Compact';
  features: string[];
  rooms: HousingRoom[];
}

export type MasterplanViewMode = '3d' | 'satelital' | 'lista';
export type TimeOfDay = 'dia' | 'noche';

export interface MasterplanFilters {
  status: LotStatus | 'all';
  searchQuery: string;
  privadaId: number | 'all';
  minSurface: number;
  maxSurface: number;
}
