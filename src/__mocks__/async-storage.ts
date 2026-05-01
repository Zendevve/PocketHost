const storage = new Map<string, string>();

export default {
  getItem: async (key: string): Promise<string | null> => {
    return storage.get(key) ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
};
