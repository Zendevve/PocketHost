import { create } from 'zustand';
import { WorldTemplate } from '../services/worldTemplateService';

interface WorldEntry {
  name: string;
  path: string;
  size: number;
}

interface WorldStore {
  worlds: WorldEntry[];
  templates: WorldTemplate[];
  isLoading: boolean;

  setWorlds: (worlds: WorldEntry[]) => void;
  setTemplates: (templates: WorldTemplate[]) => void;
  addTemplate: (template: WorldTemplate) => void;
  removeTemplate: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useWorldStore = create<WorldStore>()((set) => ({
  worlds: [],
  templates: [],
  isLoading: false,

  setWorlds: (worlds) => set({ worlds }),
  setTemplates: (templates) => set({ templates }),
  addTemplate: (template) =>
    set((s) => ({ templates: [template, ...s.templates] })),
  removeTemplate: (id) =>
    set((s) => ({ templates: s.templates.filter((t) => t.id !== id) })),
  setLoading: (isLoading) => set({ isLoading }),
}));
