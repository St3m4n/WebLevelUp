export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  const safeSlice = text.slice(0, maxLength);
  const lastSpace = safeSlice.lastIndexOf(' ');
  const cleanSlice = lastSpace > 0 ? safeSlice.slice(0, lastSpace) : safeSlice;
  return `${cleanSlice.trim()}...`;
};
