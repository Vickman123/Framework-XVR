export interface DevelopmentInfo {
  id: string;
  name: string;
  subname: string;
  type: string;
  location: string;
  state: string;
  accessRoad: string;
  slogan: string;
  tagline: string;
  disclaimer: string;
  totalPrivadas: number;
  totalAmenities: number;
  heroImage: string;
  masterplanImage: string;
}

export const CIUDAD_MADERAS_CORREGIDORA: DevelopmentInfo = {
  id: 'corregidora',
  name: 'Ciudad Maderas',
  subname: 'Corregidora',
  type: 'Residencial Privada',
  location: 'Corregidora, Querétaro',
  state: 'Querétaro, Qro.',
  accessRoad: 'Libramiento Sur-Poniente',
  slogan: 'TERRENOS · CASAS · FUTURO',
  tagline: 'Tu historia, en un mejor lugar.',
  disclaimer: '* Las medidas, ubicación y cantidad de terrenos pueden variar de acuerdo a las autorizaciones oficiales. Información e imágenes sujetas a cambios sin previo aviso. Datos con fines ilustrativos y demostrativos (DEMO).',
  totalPrivadas: 45,
  totalAmenities: 5,
  heroImage: 'images/development-thumb.jpg',
  masterplanImage: 'images/masterplan-corregidora.png',
};
