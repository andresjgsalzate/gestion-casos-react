// Test script para verificar el proceso de autenticación
const crypto = require('crypto');

const hashPassword = async (password) => {
  const data = Buffer.from(password + 'salt_secreto_2025', 'utf-8');
  const hashBuffer = crypto.createHash('sha256').update(data).digest();
  const hashHex = hashBuffer.toString('hex');
  return hashHex;
};

const verifyPassword = async (plainPassword, hashedPassword) => {
  try {
    const hashedInput = await hashPassword(plainPassword);
    return hashedInput === hashedPassword;
  } catch (error) {
    return false;
  }
};

const testAuth = async () => {
  const password = 'password123';
  const correctHash = 'abc63629ee7f33fa07373e7736c0558b47c5ab9910d7223aef4948ea3dfe9e9c';
  const wrongHash = 'wronghash123';
  
  console.log('=== Test de Autenticación ===');
  console.log('Password:', password);
  console.log('Hash correcto:', correctHash);
  console.log('');
  
  // Test 1: Contraseña correcta
  const isValidCorrect = await verifyPassword(password, correctHash);
  console.log('Test 1 - Contraseña correcta:', isValidCorrect ? 'PASS' : 'FAIL');
  
  // Test 2: Contraseña incorrecta  
  const isValidWrong = await verifyPassword('wrongpassword', correctHash);
  console.log('Test 2 - Contraseña incorrecta:', isValidWrong ? 'FAIL' : 'PASS');
  
  // Test 3: Hash incorrecto
  const isValidWrongHash = await verifyPassword(password, wrongHash);
  console.log('Test 3 - Hash incorrecto:', isValidWrongHash ? 'FAIL' : 'PASS');
  
  console.log('');
  console.log('=== Resumen ===');
  console.log('Sistema funcionando correctamente:', 
    isValidCorrect && !isValidWrong && !isValidWrongHash ? 'SÍ' : 'NO');
};

testAuth().catch(console.error);
