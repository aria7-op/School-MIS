/*
 * Draft Manager (IndexedDB-backed)
 * - Uses IndexedDB for persistence
 * - Maintains an in-memory cache to allow synchronous reads for components
 * - Migrates existing localStorage drafts (if any) into IndexedDB on init
 */

export interface DraftMetadata {
  id: string;
  studentName: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  completionPercentage: number;
}

export interface SavedDraft {
  metadata: DraftMetadata;
  formData: any;
}

const DB_NAME = 'school_app_db';
const STORE_NAME = 'student_drafts_v1';
const DB_VERSION = 1;

class DraftManager {
  private cache: SavedDraft[] = [];
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor() {
    // Load initial cache from localStorage for immediate synchronous reads
    try {
      const raw = localStorage.getItem('student_registration_drafts');
      if (raw) {
        this.cache = JSON.parse(raw);
      }
    } catch (e) {
      this.cache = [];
    }

    // Initialize IndexedDB in background, migrate any localStorage drafts,
    // then load all drafts from IndexedDB into the in-memory cache so they
    // persist across page reloads.
    this.initDB()
      .then(async () => {
        await this.migrateFromLocalStorage();
        try {
          const allDrafts = await this.loadAllFromDB();
          this.cache = Array.isArray(allDrafts) ? allDrafts : [];
          try { window.dispatchEvent(new CustomEvent('draftsUpdated')); } catch(e) {}
        } catch (e) {
          console.error('Failed to load drafts after init:', e);
        }
      })
      .catch(err => {
        console.error('DraftManager init error:', err);
      });
  }

  generateDraftId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `DRAFT-${timestamp}-${random}`;
  }

  calculateCompletion(completedSteps: number[] = []): number {
    const totalSteps = 7;
    return Math.round((completedSteps.length / totalSteps) * 100);
  }

  getStudentName(formData: any): string {
    const personal = formData.personal;
    if (personal?.firstName) return `${personal.firstName} ${personal.lastName || ''}`.trim();
    return 'Unnamed Student';
  }

  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (ev: any) => {
        const db = ev.target.result as IDBDatabase;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'metadata.id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  private async migrateFromLocalStorage() {
    try {
      const raw = localStorage.getItem('student_registration_drafts');
      if (!raw) return;

      const drafts: SavedDraft[] = JSON.parse(raw);
      if (!Array.isArray(drafts) || drafts.length === 0) return;

      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const d of drafts) {
        try { store.put(d); } catch (e) { /* ignore individual errors */ }
      }
      await new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = rej; tx.onabort = rej; });

      // Update in-memory cache from DB
      this.cache = await this.loadAllFromDB();

      // Clear localStorage migration source
      localStorage.removeItem('student_registration_drafts');
    } catch (e) {
      console.error('Draft migration failed:', e);
    }
  }

  private async loadAllFromDB(): Promise<SavedDraft[]> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      return await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as SavedDraft[]);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('Failed to load drafts from DB:', e);
      return this.cache;
    }
  }

  saveDraft(draftId: string, formData: any, currentStep: number): void {
    try {
      const now = new Date().toISOString();
      const existingIndex = this.cache.findIndex(d => d.metadata.id === draftId);
      const draft: SavedDraft = {
        metadata: {
          id: draftId,
          studentName: this.getStudentName(formData),
          createdAt: existingIndex >= 0 ? this.cache[existingIndex].metadata.createdAt : now,
          updatedAt: now,
          currentStep,
          completionPercentage: this.calculateCompletion(formData.completedSteps || [])
        },
        formData
      };

      if (existingIndex >= 0) this.cache[existingIndex] = draft;
      else this.cache.push(draft);

      // write to IndexedDB async
      this.initDB().then(db => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(draft);
        tx.oncomplete = () => {
          console.log('💾 Draft saved to IndexedDB:', draftId);
          try { window.dispatchEvent(new CustomEvent('draftsUpdated')); } catch(e) {}
        };
        tx.onerror = () => console.error('❌ Error saving draft to IndexedDB', tx.error);
      }).catch(err => console.error('DB init error on saveDraft:', err));
    } catch (error) {
      console.error('❌ Error saving draft (cache):', error);
    }
  }

  getAllDrafts(): SavedDraft[] {
    return this.cache.slice();
  }

  getDraft(draftId: string): SavedDraft | null {
    return this.cache.find(d => d.metadata.id === draftId) || null;
  }

  deleteDraft(draftId: string): void {
    try {
      this.cache = this.cache.filter(d => d.metadata.id !== draftId);
      this.initDB().then(db => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(draftId);
        tx.oncomplete = () => {
          console.log('🗑️ Draft deleted from IndexedDB:', draftId);
          try { window.dispatchEvent(new CustomEvent('draftsUpdated')); } catch(e) {}
        };
        tx.onerror = () => console.error('❌ Error deleting draft from IndexedDB', tx.error);
      }).catch(err => console.error('DB init error on deleteDraft:', err));
    } catch (error) {
      console.error('❌ Error deleting draft (cache):', error);
    }
  }

  getDraftCount(): number {
    return this.cache.length;
  }

  clearAllDrafts(): void {
    try {
      this.cache = [];
      this.initDB().then(db => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => {
          console.log('🗑️ All drafts cleared from IndexedDB');
          try { window.dispatchEvent(new CustomEvent('draftsUpdated')); } catch(e) {}
        };
        req.onerror = () => console.error('❌ Error clearing drafts in IndexedDB', req.error);
      }).catch(err => console.error('DB init error on clearAllDrafts:', err));
    } catch (error) {
      console.error('❌ Error clearing drafts (cache):', error);
    }
  }
}

export const draftManager = new DraftManager();
export default draftManager;