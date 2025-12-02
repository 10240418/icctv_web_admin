/**
 * 将 ISO 格式时间字符串转换为 yyyy/mm/dd 格式
 * @param dateString ISO 格式时间字符串，如 "2025-11-25T11:00:06.815+08:00"
 * @returns 格式化后的日期字符串，如 "2025/11/25"
 */
export function formatDate(dateString?: string | null): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch {
    return dateString;
  }
}

