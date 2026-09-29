// Export format and options chosen on the export step (kept in CVBuilder so the bottom
// "Download CV" button uses the same choice).
export type CvExportFormat = 'pdf' | 'docx' | 'html' | 'txt';

export interface CvExportSettings {
  includePageNumbers: boolean;
  includeWatermark: boolean;
  pageSize: string;
  margins: string;
  /** 'ats': real text lines built from your data; 'design': the selected template as previewed. */
  pdfLayout: 'ats' | 'design';
}

export const defaultExportSettings: CvExportSettings = {
  includePageNumbers: false,
  includeWatermark: false,
  pageSize: 'A4',
  margins: 'normal',
  pdfLayout: 'ats',
};
