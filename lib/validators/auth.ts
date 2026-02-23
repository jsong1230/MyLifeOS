export function validateEmail(email: string): string | null {
  if (!email) return '이메일을 입력해주세요'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) return '올바른 이메일 형식을 입력해주세요'
  return null
}

export function validatePassword(password: string): string | null {
  if (!password) return '비밀번호를 입력해주세요'
  if (password.length < 8) return '비밀번호는 8자 이상이어야 합니다'
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  if (!hasLetter || !hasNumber) return '비밀번호는 영문과 숫자를 모두 포함해야 합니다'
  return null
}

export function validateConfirmPassword(password: string, confirm: string): string | null {
  if (password !== confirm) return '비밀번호가 일치하지 않습니다'
  return null
}

export function getAuthErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다',
    'User already registered': '이미 가입된 이메일입니다. 로그인해주세요',
    'Email not confirmed': '이메일 인증을 완료해주세요. 메일함을 확인하세요',
    'Password should be at least 6 characters': '비밀번호는 8자 이상이어야 합니다',
    'For security purposes, you can only request this once every 60 seconds': '잠시 후 다시 시도해주세요 (1분 제한)',
    'Email rate limit exceeded': '잠시 후 다시 시도해주세요',
    'Invalid email': '올바른 이메일 형식을 입력해주세요',
  }

  for (const [key, value] of Object.entries(errorMap)) {
    if (error.includes(key)) return value
  }
  return '일시적인 오류가 발생했습니다. 다시 시도해주세요'
}
