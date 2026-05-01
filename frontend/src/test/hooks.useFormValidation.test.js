import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFormValidation, rules } from '../hooks/useFormValidation';

describe('useFormValidation', () => {
  describe('rules.required', () => {
    it('fails on empty string', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: [rules.required('Name required')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ name: '' }); });
      expect(valid).toBe(false);
      expect(result.current.errors.name).toBe('Name required');
    });

    it('fails on whitespace-only string', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: [rules.required('Name required')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ name: '   ' }); });
      expect(valid).toBe(false);
    });

    it('passes on non-empty string', () => {
      const { result } = renderHook(() =>
        useFormValidation({ name: [rules.required('Name required')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ name: 'Alice' }); });
      expect(valid).toBe(true);
      expect(result.current.errors.name).toBeUndefined();
    });
  });

  describe('rules.minLength', () => {
    it('fails when string is too short', () => {
      const { result } = renderHook(() =>
        useFormValidation({ pw: [rules.minLength(6, 'Min 6 chars')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ pw: 'abc' }); });
      expect(valid).toBe(false);
      expect(result.current.errors.pw).toBe('Min 6 chars');
    });

    it('passes when string meets minimum length', () => {
      const { result } = renderHook(() =>
        useFormValidation({ pw: [rules.minLength(6, 'Min 6 chars')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ pw: 'abcdef' }); });
      expect(valid).toBe(true);
    });

    it('fails on empty string (minLength always validates)', () => {
      const { result } = renderHook(() =>
        useFormValidation({ pw: [rules.minLength(6, 'Min 6 chars')] })
      );
      let valid;
      act(() => { valid = result.current.validate({ pw: '' }); });
      // empty string has length 0 < 6, so it fails
      expect(valid).toBe(false);
      expect(result.current.errors.pw).toBe('Min 6 chars');
    });
  });

  describe('rules.maxLength', () => {
    it('fails when string exceeds max length', () => {
      const { result } = renderHook(() =>
        useFormValidation({ bio: [rules.maxLength(10)] })
      );
      let valid;
      act(() => { valid = result.current.validate({ bio: 'a'.repeat(11) }); });
      expect(valid).toBe(false);
    });

    it('passes when string is within max length', () => {
      const { result } = renderHook(() =>
        useFormValidation({ bio: [rules.maxLength(10)] })
      );
      let valid;
      act(() => { valid = result.current.validate({ bio: 'short' }); });
      expect(valid).toBe(true);
    });
  });

  describe('rules.phone', () => {
    it('fails on invalid phone number', () => {
      const { result } = renderHook(() =>
        useFormValidation({ phone: [rules.phone()] })
      );
      let valid;
      act(() => { valid = result.current.validate({ phone: 'abc' }); });
      expect(valid).toBe(false);
    });

    it('passes on valid Tunisian phone number', () => {
      const { result } = renderHook(() =>
        useFormValidation({ phone: [rules.phone()] })
      );
      let valid;
      act(() => { valid = result.current.validate({ phone: '+21612345678' }); });
      expect(valid).toBe(true);
    });

    it('fails on empty phone (phone regex requires digits)', () => {
      const { result } = renderHook(() =>
        useFormValidation({ phone: [rules.phone()] })
      );
      let valid;
      act(() => { valid = result.current.validate({ phone: '' }); });
      // empty string doesn't match phone regex
      expect(valid).toBe(false);
    });
  });

  describe('multiple rules', () => {
    it('stops at first failing rule', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          name: [rules.required('Required'), rules.minLength(3, 'Too short')],
        })
      );
      let valid;
      act(() => { valid = result.current.validate({ name: '' }); });
      expect(valid).toBe(false);
      expect(result.current.errors.name).toBe('Required');
    });

    it('validates all fields and returns false if any fail', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          firstName: [rules.required('First name required')],
          lastName:  [rules.required('Last name required')],
        })
      );
      let valid;
      act(() => { valid = result.current.validate({ firstName: 'Alice', lastName: '' }); });
      expect(valid).toBe(false);
      expect(result.current.errors.lastName).toBe('Last name required');
      expect(result.current.errors.firstName).toBeUndefined();
    });

    it('returns true when all fields pass', () => {
      const { result } = renderHook(() =>
        useFormValidation({
          firstName: [rules.required('Required'), rules.minLength(2, 'Too short')],
          lastName:  [rules.required('Required')],
        })
      );
      let valid;
      act(() => { valid = result.current.validate({ firstName: 'Alice', lastName: 'Dupont' }); });
      expect(valid).toBe(true);
    });
  });
});
