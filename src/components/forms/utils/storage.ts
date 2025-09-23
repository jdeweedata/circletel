// Draft saving and loading utilities

export interface FormDraft {
  id: string;
  clientName: string;
  formType: string;
  data: Record<string, unknown>;
  lastSaved: string;
  progress: number;
}

const STORAGE_PREFIX = 'circletel_form_draft_';

export class FormStorage {
  static saveDraft(clientName: string, formType: string, data: Record<string, unknown>, progress: number): void {
    const draft: FormDraft = {
      id: `${clientName}_${formType}_${Date.now()}`,
      clientName,
      formType,
      data,
      lastSaved: new Date().toISOString(),
      progress
    };

    const key = `${STORAGE_PREFIX}${clientName}_${formType}`;
    localStorage.setItem(key, JSON.stringify(draft));
  }

  static loadDraft(clientName: string, formType: string): FormDraft | null {
    const key = `${STORAGE_PREFIX}${clientName}_${formType}`;
    const stored = localStorage.getItem(key);

    if (!stored) return null;

    try {
      return JSON.parse(stored) as FormDraft;
    } catch {
      return null;
    }
  }

  static deleteDraft(clientName: string, formType: string): void {
    const key = `${STORAGE_PREFIX}${clientName}_${formType}`;
    localStorage.removeItem(key);
  }

  static listDrafts(): FormDraft[] {
    const drafts: FormDraft[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            drafts.push(JSON.parse(stored));
          } catch {
            // Skip invalid drafts
          }
        }
      }
    }

    return drafts.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime());
  }
}

// Custom hook for form persistence
export function useFormPersistence(clientName: string, formType: string) {
  const saveDraft = (data: Record<string, unknown>, progress: number) => {
    FormStorage.saveDraft(clientName, formType, data, progress);
  };

  const loadDraft = () => {
    return FormStorage.loadDraft(clientName, formType);
  };

  const deleteDraft = () => {
    FormStorage.deleteDraft(clientName, formType);
  };

  return { saveDraft, loadDraft, deleteDraft };
}