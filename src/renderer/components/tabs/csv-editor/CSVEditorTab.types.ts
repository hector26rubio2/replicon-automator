import type { CSVRow, AccountMappings } from '../../../../shared/types';

export interface CSVEditorTabProps {
  data: CSVRow[] | null;
  onDataChange: (data: CSVRow[]) => void;
  onLoadCSV: () => Promise<void>;
  onSaveCSV: () => Promise<void>;
  mappings: AccountMappings;
}

export type DayInfo = {
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1..31
  dowLabel: string; // Lun, Mar...
  isWeekend: boolean;
  isHoliday: boolean;
};

export type ExtDraftEntry = {
  cuenta: string;
  proyecto: string;
  inicio: string; // HHmm
  fin: string; // HHmm
};
