// Utilidades para manejo de contraseñas
// Nota: En producción se recomienda usar una librería como bcrypt

/**
 * Hashea una contraseña usando un algoritmo simple
 * En producción debería usar bcrypt o similar
 */
export const hashPassword = async (password: string): Promise<string> => {
  // Por simplicidad, usamos una función básica de hash
  // En producción deberías usar bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_secreto_2025');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

/**
 * Valida que una contraseña cumpla con los requisitos mínimos
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'La contraseña no puede tener más de 128 caracteres' };
  }
  
  // Opcional: agregar más validaciones
  // const hasUpperCase = /[A-Z]/.test(password);
  // const hasLowerCase = /[a-z]/.test(password);
  // const hasNumbers = /\d/.test(password);
  // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return { isValid: true };
};

/**
 * Genera una contraseña temporal aleatoria
 */
export const generateTempPassword = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Verifica si una contraseña plana coincide con su hash
 */
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  try {
    const hashedInput = await hashPassword(plainPassword);
    return hashedInput === hashedPassword;
  } catch (error) {
    return false;
  }
};

const passwordUtils = {
  hashPassword,
  validatePassword,
  generateTempPassword,
  verifyPassword
};

export default passwordUtils;
