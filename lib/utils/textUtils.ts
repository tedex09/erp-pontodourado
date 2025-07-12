/**
 * Utilitários para manipulação de texto
 */

/**
 * Remove acentos de uma string
 */
export function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Compara duas strings ignorando acentos e case
 */
export function compareIgnoreAccents(str1: string, str2: string): boolean {
  return removeAccents(str1) === removeAccents(str2);
}

/**
 * Verifica se uma string contém outra ignorando acentos e case
 */
export function includesIgnoreAccents(haystack: string, needle: string): boolean {
  return removeAccents(haystack).includes(removeAccents(needle));
}

/**
 * Filtra array de objetos por texto ignorando acentos
 */
export function filterByTextIgnoreAccents<T>(
  items: T[],
  searchTerm: string,
  fields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return items;
  
  const normalizedSearch = removeAccents(searchTerm);
  
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return includesIgnoreAccents(value, normalizedSearch);
      }
      return false;
    })
  );
}