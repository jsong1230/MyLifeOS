export function validateEmail(email: string): string | null {
  if (!email) return 'emailRequired'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return 'emailInvalid'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return 'passwordRequired'
  if (password.length < 8) return 'passwordTooShort'
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  if (!hasLetter || !hasNumber) return 'passwordWeak'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (password !== confirm) return 'passwordMismatch'
  return null
}

export function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': 'INVALID_CREDENTIALS',
    'User already registered': 'USER_EXISTS',
    'Email not confirmed': 'EMAIL_NOT_CONFIRMED',
    'Password should be at least 6 characters': 'passwordTooShort',
    'For security purposes, you can only request this once every 60 seconds': 'RATE_LIMIT',
    'Email rate limit exceeded': 'RATE_LIMIT',
    'Invalid email': 'emailInvalid',
  }

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value
  }
  return 'UNKNOWN'
}
