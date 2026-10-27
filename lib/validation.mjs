const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegistration({ name, email, password } = {}) {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (cleanName.length < 1 || cleanName.length > 80) return { error: 'Enter a name between 1 and 80 characters.' };
  if (!emailPattern.test(cleanEmail) || cleanEmail.length > 254) return { error: 'Enter a valid email address.' };
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return { error: 'Use a password between 8 and 128 characters.' };
  return { name: cleanName, email: cleanEmail, password };
}

export function detectImageMime(input) {
  const bytes = Buffer.from(input || []);
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
