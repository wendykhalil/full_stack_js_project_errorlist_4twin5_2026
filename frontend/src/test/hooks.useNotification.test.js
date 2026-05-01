import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useNotification } from '../hooks/useNotification';

describe('useNotification', () => {
  it('starts with no notification', () => {
    const { result } = renderHook(() => useNotification());
    expect(result.current.notification).toBeNull();
  });

  it('showNotification sets message and type', () => {
    const { result } = renderHook(() => useNotification());
    act(() => { result.current.showNotification('Test message', 'error'); });
    expect(result.current.notification).toMatchObject({
      message: 'Test message',
      type: 'error',
    });
  });

  it('hideNotification clears the notification', () => {
    const { result } = renderHook(() => useNotification());
    act(() => { result.current.showNotification('Hello', 'error'); });
    act(() => { result.current.hideNotification(); });
    expect(result.current.notification).toBeNull();
  });

  it('defaults type to success when not specified', () => {
    const { result } = renderHook(() => useNotification());
    act(() => { result.current.showNotification('Default type'); });
    expect(result.current.notification?.type).toBe('success');
  });

  it('supports success type', () => {
    const { result } = renderHook(() => useNotification());
    act(() => { result.current.showNotification('Done!', 'success'); });
    expect(result.current.notification?.type).toBe('success');
  });

  it('supports warning type', () => {
    const { result } = renderHook(() => useNotification());
    act(() => { result.current.showNotification('Watch out', 'warning'); });
    expect(result.current.notification?.type).toBe('warning');
  });
});
