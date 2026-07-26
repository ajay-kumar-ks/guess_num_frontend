import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateGuess, validateSecret } from './passAndPlay.js'

test('counts exact and misplaced digits correctly', () => {
  assert.deepEqual(evaluateGuess('123', '132'), { positionCount: 1, numberCount: 2, isMatch: false })
  assert.deepEqual(evaluateGuess('123', '123'), { positionCount: 3, numberCount: 0, isMatch: true })
  assert.deepEqual(evaluateGuess('437', '734'), { positionCount: 1, numberCount: 2, isMatch: false })
})

test('validates secret requirements', () => {
  assert.equal(validateSecret('123').valid, true)
  assert.equal(validateSecret('112').valid, false)
  assert.equal(validateSecret('12').valid, false)
  assert.equal(validateSecret('abc').valid, false)
})
