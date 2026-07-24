export function validateSecret(secret) {
  if (typeof secret !== 'string') return { valid: false, message: 'Secret must be a 3-digit code.' }
  if (!/^\d{3}$/.test(secret)) return { valid: false, message: 'Secret must contain exactly 3 digits.' }
  const digits = secret.split('')
  if (new Set(digits).size !== 3) return { valid: false, message: 'Digits must be unique.' }
  return { valid: true }
}

export function evaluateGuess(guess, secret) {
  const guessDigits = guess.split('')
  const secretDigits = secret.split('')

  let positionCount = 0
  let numberCount = 0

  for (let i = 0; i < guessDigits.length; i += 1) {
    if (guessDigits[i] === secretDigits[i]) positionCount += 1
  }

  const guessCounts = guessDigits.reduce((acc, digit) => {
    acc[digit] = (acc[digit] || 0) + 1
    return acc
  }, {})

  const secretCounts = secretDigits.reduce((acc, digit) => {
    acc[digit] = (acc[digit] || 0) + 1
    return acc
  }, {})

  Object.keys(guessCounts).forEach((digit) => {
    if (secretCounts[digit]) {
      numberCount += Math.min(guessCounts[digit], secretCounts[digit])
    }
  })

  return {
    positionCount,
    numberCount,
    isMatch: positionCount === 3 && numberCount === 3,
  }
}
