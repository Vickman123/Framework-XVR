/**
 * Catálogo Centralizado de Assets del Simulador PC PUMA
 * 
 * Para cambiar cualquier elemento visual o sonoro, solo coloca el archivo 
 * correspondiente en la carpeta public/ con el nombre indicado abajo.
 */

export const ASSET_PATHS = {
  // 1. Logos e Imágenes de Interfaz
  LOGO_MENU: 'pc_puma_logo.png',

  // 2. Texturas de la Credencial UNAM
  CREDENTIAL_FRONT: 'textures/credential_front.png',
  CREDENTIAL_BACK: 'textures/credential_back.png',

  // 3. Texturas de Laptop
  LAPTOP_WALLPAPER: 'textures/laptop_wallpaper.png',
  LAPTOP_LID_LOGO: 'textures/laptop_lid_logo.png',

  // 4. Lector NFC y Accesorios
  NFC_PAD: 'textures/nfc_pad.png',
  TRAY_LABEL: 'textures/tray_label.png',

  // 5. Entorno, Carteles y Paredes
  WALL_BANNER: 'images/wall_banner.png',
  POSTER_RULES: 'images/poster_rules.png',
  FLOOR_TILES: 'textures/floor_tiles.png',

  // 6. Efectos de Audio (Opcionales para sustituir sintetizador)
  AUDIO_NFC_BEEP: 'audio/nfc_beep.mp3',
  AUDIO_SUCCESS: 'audio/success.mp3',
  AUDIO_ERROR: 'audio/error.mp3',
  AUDIO_LAPTOP_SNAP: 'audio/laptop_snap.mp3',
};
