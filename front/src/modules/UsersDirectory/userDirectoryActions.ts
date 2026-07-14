type UserDirectorySelection = {
  setSelectedTr: (value: null) => unknown;
  setSelectRowDirectory: (value: null) => unknown;
};

export const normalizeUserId = (value: unknown): string | null => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    return normalized || null;
  }
  if (typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value)) {
    return String(value);
  }
  return null;
};

export const getDeletableUserId = (
  selectedUserId: unknown,
  currentUserId: unknown,
): string | null => {
  const selected = normalizeUserId(selectedUserId);
  const current = normalizeUserId(currentUserId);
  return selected !== null && current !== null && selected !== current ? selected : null;
};

export const clearUserDirectorySelection = (selection: UserDirectorySelection): void => {
  selection.setSelectedTr(null);
  selection.setSelectRowDirectory(null);
};
