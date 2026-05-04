const STORAGE_KEY = 'proposals_saved_filters';

export function getSavedFilters() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveFilter(name, filters) {
  const filters_list = getSavedFilters();
  const id = `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newFilter = {
    id,
    name,
    filters: {
      statuses: filters.statuses || [],
      types: filters.types || [],
      tags: filters.tags || [],
      projectId: filters.projectId || '',
      dateFrom: filters.dateFrom || '',
      dateTo: filters.dateTo || '',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  filters_list.unshift(newFilter);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters_list));
  return { success: true, filters: filters_list };
}

export function updateFilter(id, updates) {
  const filters_list = getSavedFilters();
  const index = filters_list.findIndex(f => f.id === id);
  if (index === -1) {
    return { success: false, error: 'Filter not found', filters: filters_list };
  }
  filters_list[index] = {
    ...filters_list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filters_list));
  return { success: true, filters: filters_list };
}

export function deleteFilter(id) {
  const filters_list = getSavedFilters();
  const filtered = filters_list.filter(f => f.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return { success: true, filters: filtered };
}

export function clearAllFilters() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return { success: true, filters: [] };
}
