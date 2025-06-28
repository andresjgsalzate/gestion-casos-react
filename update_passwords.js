// Script para generar hashes de contraseñas usando el mismo algoritmo del frontend

const crypto = require('crypto');

const hashPassword = async (password) => {
  const data = Buffer.from(password + 'salt_secreto_2025', 'utf-8');
  const hashBuffer = crypto.createHash('sha256').update(data).digest();
  const hashHex = hashBuffer.toString('hex');
  return hashHex;
};

// Generar hashes para las contraseñas de ejemplo
const generateHashes = async () => {
  const password = 'password123';
  const hash = await hashPassword(password);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Generar hashes para diferentes contraseñas si necesitas más variedad
  const passwords = ['password123', 'admin123', 'user123'];
  console.log('\nTodos los hashes:');
  for (const pwd of passwords) {
    const h = await hashPassword(pwd);
    console.log(`${pwd} -> ${h}`);
  }
};

generateHashes();
