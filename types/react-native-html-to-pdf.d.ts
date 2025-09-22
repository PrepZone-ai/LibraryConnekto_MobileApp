declare module 'react-native-html-to-pdf' {
  interface PDFOptions {
    html: string;
    fileName?: string;
    directory?: string;
    height?: number;
    width?: number;
    base64?: boolean;
  }

  interface PDFResult {
    filePath: string;
    base64?: string;
  }

  export default {
    convert(options: PDFOptions): Promise<PDFResult>;
  };
}
