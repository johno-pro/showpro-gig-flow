/**
 * Input sanitization utilities to prevent XSS and injection attacks
 * 
 * Note: React's JSX automatically escapes text content, preventing most XSS attacks.
 * These utilities provide additional protection for specific use cases.
 */

/**
 * Escapes HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * Sanitizes text input by trimming and limiting length
 */
export function sanitizeText(text: string, maxLength: number = 10000): string {
  if (!text) return '';
  
  // Trim whitespace
  let sanitized = text.trim();
  
  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized;
}

/**
 * Validates and sanitizes URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const trimmed = url.trim();
  
  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    return '';
  }
  
  return trimmed;
}

/**
 * Sanitizes phone/mobile numbers to only allow digits, spaces, +, -, (, )
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Only allow digits, spaces, +, -, (, )
  return phone.replace(/[^\d\s+\-()]/g, '');
}

/**
 * Validates email format (basic check)
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Sanitizes file name to prevent path traversal
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return 'unnamed';
  
  // Remove path separators and special characters
  let sanitized = fileName.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Remove leading dots
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.substring(0, 255 - ext.length - 1);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized || 'unnamed';
}
