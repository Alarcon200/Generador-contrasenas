'use strict';

const $ = (id) => document.getElementById(id);
const lengthInput = $('length');
const lengthOutput = $('length-output');
const passwordOutput = $('password');
const errorOutput = $('error');
const statusOutput = $('status');
const counterOutput = $('counter');

const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?'
};

// Obtiene un entero sin sesgo de módulo usando aleatoriedad criptográfica.
function secureRandomInt(maxExclusive) {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > 256) {
    throw new Error('Límite aleatorio inválido.');
  }
  const limit = Math.floor(256 / maxExclusive) * maxExclusive;
  const bytes = new Uint8Array(1);
  do {
    crypto.getRandomValues(bytes);
  } while (bytes[0] >= limit);
  return bytes[0] % maxExclusive;
}

function validateConfiguration() {
  const length = Number(lengthInput.value);
  const selectedSets = Object.keys(CHARACTER_SETS)
    .filter((key) => $(key).checked)
    .map((key) => CHARACTER_SETS[key]);

  if (!Number.isInteger(length) || length < 8 || length > 64) {
    return { valid: false, message: 'La longitud debe estar entre 8 y 64 caracteres.' };
  }
  if (selectedSets.length === 0) {
    return { valid: false, message: 'Selecciona al menos un tipo de carácter.' };
  }
  if (length < selectedSets.length) {
    return { valid: false, message: 'La longitud es insuficiente para incluir todos los tipos seleccionados.' };
  }
  return { valid: true, length, selectedSets };
}

function shuffleSecurely(characters) {
  for (let i = characters.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [characters[i], characters[j]] = [characters[j], characters[i]];
  }
  return characters;
}

function generatePassword() {
  errorOutput.textContent = '';
  const config = validateConfiguration();
  if (!config.valid) {
    passwordOutput.value = '';
    statusOutput.textContent = 'Corrige la configuración para continuar.';
    counterOutput.textContent = '0 caracteres';
    errorOutput.textContent = config.message;
    return;
  }

  if (!globalThis.crypto || typeof crypto.getRandomValues !== 'function') {
    passwordOutput.value = '';
    errorOutput.textContent = 'Este navegador no ofrece aleatoriedad criptográfica compatible.';
    statusOutput.textContent = 'No se generó la contraseña.';
    counterOutput.textContent = '0 caracteres';
    return;
  }

  try {
    const allCharacters = config.selectedSets.join('');
    const characters = config.selectedSets.map((set) => set[secureRandomInt(set.length)]);
    while (characters.length < config.length) {
      characters.push(allCharacters[secureRandomInt(allCharacters.length)]);
    }
    const password = shuffleSecurely(characters).join('');
    passwordOutput.value = password;
    statusOutput.textContent = 'Contraseña generada correctamente.';
    counterOutput.textContent = `${password.length} caracteres`;
  } catch (error) {
    passwordOutput.value = '';
    errorOutput.textContent = 'No fue posible generar la contraseña. Intenta de nuevo.';
    statusOutput.textContent = 'Generación fallida.';
    counterOutput.textContent = '0 caracteres';
  }
}

async function copyPassword() {
  errorOutput.textContent = '';
  if (!passwordOutput.value) {
    errorOutput.textContent = 'Primero genera una contraseña.';
    statusOutput.textContent = 'No hay contraseña para copiar.';
    return;
  }
  try {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
      throw new Error('Portapapeles no disponible');
    }
    await navigator.clipboard.writeText(passwordOutput.value);
    statusOutput.textContent = 'Contraseña copiada al portapapeles.';
  } catch (error) {
    statusOutput.textContent = 'El navegador bloqueó la copia automática. Selecciona y copia la contraseña manualmente.';
  }
}

function evaluatePassword(password, config) {
  if (password.length !== config.length) return false;
  return config.selectedSets.every((set) => [...set].some((character) => password.includes(character)));
}

function updateLengthLabel() {
  lengthOutput.value = lengthInput.value;
  lengthOutput.textContent = lengthInput.value;
}

lengthInput.addEventListener('input', updateLengthLabel);
$('generate').addEventListener('click', generatePassword);
$('copy').addEventListener('click', copyPassword);
updateLengthLabel();

// Permite que el proyecto y la sustentación consulten esta función de validación.
window.evaluateGeneratedPassword = evaluatePassword;
