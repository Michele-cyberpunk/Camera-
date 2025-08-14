export interface ImageState {
  file: File | null;
  beforeUrl: string | null;
  afterUrl: string | null;
  finalUrl: string | null;
  mimeType: string | null;
}

export interface ExtractedColor {
  hex: string;
  name: string;
  semantic: string;
}

export interface ColorPalette {
  colors: ExtractedColor[];
}
