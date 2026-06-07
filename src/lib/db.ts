import fs from 'fs';
import path from 'path';

// Define Interface schemas for future Database mapping
export interface SubtitleTaskRecord {
  id: string;
  title: string;
  totalLines: number;
  processedAt: string;
  aspectRatio: string;
  sourceFiles: string[];
  userId?: string;
}

export interface TranslationLog {
  id: string;
  taskId: string;
  sourceLang: string;
  targetLang: string;
  translatedLines: number;
  engineUsed: string;
  timestamp: string;
}

export interface ConversionRecord {
  id: string;
  filename: string;
  formatFrom: string;
  formatTo: string;
  fileSize: number;
  timestamp: string;
}

// Simple Mock JSON File Database Adapter (Open for SQLite/PostgreSQL replacement)
const DB_DIR = path.join(process.cwd(), 'data');
const TASKS_FILE = path.join(DB_DIR, 'tasks.json');
const LOGS_FILE = path.join(DB_DIR, 'translation_logs.json');
const CONVERSIONS_FILE = path.join(DB_DIR, 'conversions.json');

function ensureDbExists() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(TASKS_FILE)) fs.writeFileSync(TASKS_FILE, JSON.stringify([]));
  if (!fs.existsSync(LOGS_FILE)) fs.writeFileSync(LOGS_FILE, JSON.stringify([]));
  if (!fs.existsSync(CONVERSIONS_FILE)) fs.writeFileSync(CONVERSIONS_FILE, JSON.stringify([]));
}

// Database Interfaces
export const db = {
  // --- Tasks ---
  async getTasks(): Promise<SubtitleTaskRecord[]> {
    ensureDbExists();
    try {
      const data = fs.readFileSync(TASKS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  async saveTask(record: SubtitleTaskRecord): Promise<void> {
    ensureDbExists();
    const list = await this.getTasks();
    list.unshift(record);
    fs.writeFileSync(TASKS_FILE, JSON.stringify(list, null, 2));
  },

  // --- Translation Logs ---
  async getTranslationLogs(): Promise<TranslationLog[]> {
    ensureDbExists();
    try {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  async saveTranslationLog(log: TranslationLog): Promise<void> {
    ensureDbExists();
    const list = await this.getTranslationLogs();
    list.unshift(log);
    fs.writeFileSync(LOGS_FILE, JSON.stringify(list, null, 2));
  },

  // --- Conversion Records ---
  async getConversions(): Promise<ConversionRecord[]> {
    ensureDbExists();
    try {
      const data = fs.readFileSync(CONVERSIONS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  },

  async saveConversion(record: ConversionRecord): Promise<void> {
    ensureDbExists();
    const list = await this.getConversions();
    list.unshift(record);
    fs.writeFileSync(CONVERSIONS_FILE, JSON.stringify(list, null, 2));
  }
};
