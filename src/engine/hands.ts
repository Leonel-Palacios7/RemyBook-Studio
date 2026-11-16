/** Apariencia de las manos del lector. */
export interface HandsLook {
  /** Tono de piel. */
  tone: string;
  /** Color de la manga. */
  sleeve: string;
}

export const SKIN_TONES = [
  { value: '#FFD521', label: 'Amarillo caricatura' },
  { value: '#F3D2B8', label: 'Muy claro' },
  { value: '#E4B48F', label: 'Claro' },
  { value: '#C98E62', label: 'Medio' },
  { value: '#9A6440', label: 'Moreno' },
  { value: '#6B4129', label: 'Oscuro' },
];

/** Valores por defecto: manos visibles, amarillo caricatura y manga verde SENA. */
export const DEFAULT_HANDS = { enabled: true, tone: '#FFD521', sleeve: '#39A900' };
