const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const ITERATIONS = 100000
const VERIFY_TEXT = 'EXPENSE_MANAGER_VERIFY'

export async function deriveKey(passphrase: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptText(text: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(text)
  )

  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
  combined.set(iv)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return btoa(String.fromCharCode(...combined))
}

export async function decryptText(encoded: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const ciphertext = combined.slice(12)

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  )

  return new TextDecoder().decode(decrypted)
}

export async function createVerifyToken(key: CryptoKey): Promise<string> {
  return encryptText(VERIFY_TEXT, key)
}

export async function verifyPassphrase(key: CryptoKey, token: string): Promise<boolean> {
  try {
    const decrypted = await decryptText(token, key)
    return decrypted === VERIFY_TEXT
  } catch {
    return false
  }
}

// Encrypt title and category of an expense
export async function encryptExpense<T extends { title: string; category: string | string[] }>(
  expense: T,
  key: CryptoKey
): Promise<T> {
  return {
    ...expense,
    title: await encryptText(expense.title, key),
    category: await encryptText(JSON.stringify(expense.category), key),
  }
}

// Decrypt title and category of an expense
export async function decryptExpense<T extends { title: string; category: string | string[] }>(
  expense: T,
  key: CryptoKey
): Promise<T> {
  try {
    return {
      ...expense,
      title: await decryptText(expense.title, key),
      category: JSON.parse(await decryptText(expense.category as string, key)),
    }
  } catch {
    // Legacy unencrypted data — return as-is
    return expense
  }
}
