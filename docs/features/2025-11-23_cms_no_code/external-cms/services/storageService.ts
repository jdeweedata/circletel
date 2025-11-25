import { Page } from '../types';

const STORAGE_KEY = 'ai_cms_pages';

export const getPages = (): Page[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const pages = data ? JSON.parse(data) : [];
    
    // Schema migration: Ensure all pages have a status
    // This effectively acts as adding a default value to a column in a SQL table
    return pages.map((p: any) => ({
      ...p,
      status: p.status || 'draft'
    }));
  } catch (e) {
    console.error("Failed to load pages", e);
    return [];
  }
};

export const getPageById = (id: string): Page | undefined => {
  const pages = getPages();
  return pages.find((p) => p.id === id);
};

export const savePage = (page: Page): void => {
  const pages = getPages();
  const existingIndex = pages.findIndex((p) => p.id === page.id);
  
  if (existingIndex >= 0) {
    // Update existing page
    pages[existingIndex] = { ...page, updated_at: new Date().toISOString() };
  } else {
    // Create new page
    pages.push(page);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
};

export const deletePage = (id: string): void => {
  const pages = getPages();
  const filtered = pages.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};