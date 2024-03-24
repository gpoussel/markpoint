import { describe, it, expect } from 'vitest'

import { template } from '../libs/string-utils.js'

describe('template', () => {
  it('should replace placeholders in the template string with corresponding values from the data object', () => {
    const templateString = 'Hello, {name}! You are {age} years old.'
    const data = {
      name: 'John',
      age: 30,
    }
    const expected = 'Hello, John! You are 30 years old.'

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })

  it('should not replace placeholders that do not exist in the data object', () => {
    const templateString = 'Hello, {name}! You are {age} years old.'
    const data = {
      name: 'John',
    }
    const expected = 'Hello, John! You are {age} years old.'

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })

  it('should handle placeholders with numeric values in the data object', () => {
    const templateString = 'The answer is {answer}.'
    const data = {
      answer: 42,
    }
    const expected = 'The answer is 42.'

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })

  it('should handle multiple occurrences of the same placeholder in the template string', () => {
    const templateString = 'Hello, {name}! Nice to meet you, {name}!'
    const data = {
      name: 'John',
    }
    const expected = 'Hello, John! Nice to meet you, John!'

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })

  it('should handle empty template strings', () => {
    const templateString = ''
    const data = {
      name: 'John',
      age: 30,
    }
    const expected = ''

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })

  it('should handle empty data objects', () => {
    const templateString = 'Hello, {name}! You are {age} years old.'
    const data = {}
    const expected = 'Hello, {name}! You are {age} years old.'

    const result = template(templateString, data)

    expect(result).toEqual(expected)
  })
})
