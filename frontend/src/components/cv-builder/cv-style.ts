// CV style settings shared by the customizer, preview and exports.
export type CVStyle = {
  templateName: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
};

export const defaultCVStyle: CVStyle = {
  templateName: 'default',
  primaryColor: '#000000',
  secondaryColor: '#FFFFFF',
  fontFamily: 'Arial, sans-serif',
  fontSize: 11,
};

export const ACCENT_PRESETS = [
  { name: 'Black', value: '#000000' },
  { name: 'Navy', value: '#1e3a8a' },
  { name: 'Blue', value: '#1d4ed8' },
  { name: 'Teal', value: '#0f766e' },
  { name: 'Green', value: '#15803d' },
  { name: 'Burgundy', value: '#9f1239' },
  { name: 'Purple', value: '#6d28d9' },
] as const;

// Fonts that are installed on almost every computer, so the preview, PDF and Word look alike.
export const FONT_OPTIONS = [
  { label: 'Arial (sans-serif)', value: 'Arial, sans-serif' },
  { label: 'Calibri (sans-serif)', value: 'Calibri, Carlito, Arial, sans-serif' },
  { label: 'Helvetica (sans-serif)', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, serif' },
  { label: 'Times New Roman (serif)', value: 'Times New Roman, Times, serif' },
] as const;
