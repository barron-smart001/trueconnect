const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isEmail = (value: string) => EMAIL.test(value.trim())

export const MIN_PASSWORD = 8
