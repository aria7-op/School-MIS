const DRAFT_PREFIX = 'customer_draft_';

export interface DraftData {
  formData: any;
  timestamp: number;
  id: string;
}

// Storage helper that works with both web (localStorage) and React Native (AsyncStorage)
const getStorage = async () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    // Web environment - return localStorage wrapper
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  } else {
    // React Native environment
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    return AsyncStorage.default;
  }
};

export const draftStorage = {
  async saveDraft(id: string, formData: any): Promise<void> {
    try {
      const storage = await getStorage();
      const draft: DraftData = {
        formData,
        timestamp: Date.now(),
        id,
      };
      await storage.setItem(`${DRAFT_PREFIX}${id}`, JSON.stringify(draft));
      
      // Also save to list of all drafts
      const draftsList = await this.getAllDraftIds();
      if (!draftsList.includes(id)) {
        draftsList.push(id);
        await storage.setItem('customer_drafts_list', JSON.stringify(draftsList));
      }
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  },

  async getDraft(id: string): Promise<DraftData | null> {
    try {
      const storage = await getStorage();
      const draftJson = await storage.getItem(`${DRAFT_PREFIX}${id}`);
      if (draftJson) {
        return JSON.parse(draftJson);
      }
      return null;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  },

  async deleteDraft(id: string): Promise<void> {
    try {
      const storage = await getStorage();
      await storage.removeItem(`${DRAFT_PREFIX}${id}`);
      
      // Remove from drafts list
      const draftsList = await this.getAllDraftIds();
      const updatedList = draftsList.filter((draftId) => draftId !== id);
      await storage.setItem('customer_drafts_list', JSON.stringify(updatedList));
    } catch (error) {
      console.error('Error deleting draft:', error);
    }
  },

  async getAllDraftIds(): Promise<string[]> {
    try {
      const storage = await getStorage();
      const draftsListJson = await storage.getItem('customer_drafts_list');
      if (draftsListJson) {
        return JSON.parse(draftsListJson);
      }
      return [];
    } catch (error) {
      console.error('Error getting draft IDs:', error);
      return [];
    }
  },

  async getAllDrafts(): Promise<DraftData[]> {
    try {
      const draftIds = await this.getAllDraftIds();
      const drafts = await Promise.all(
        draftIds.map((id) => this.getDraft(id))
      );
      return drafts.filter((draft): draft is DraftData => draft !== null);
    } catch (error) {
      console.error('Error getting all drafts:', error);
      return [];
    }
  },

  async clearAllDrafts(): Promise<void> {
    try {
      const draftIds = await this.getAllDraftIds();
      await Promise.all(draftIds.map((id) => this.deleteDraft(id)));
      const storage = await getStorage();
      await storage.removeItem('customer_drafts_list');
    } catch (error) {
      console.error('Error clearing all drafts:', error);
    }
  },
};

