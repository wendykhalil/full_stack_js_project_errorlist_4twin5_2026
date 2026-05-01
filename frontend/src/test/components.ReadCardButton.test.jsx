import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReadCardButton from '../components/ReadCardButton';

// ── Proper SpeechSynthesisUtterance class mock ────────────────────────────────
class MockUtterance {
  constructor(text) {
    this.text = text;
    this.lang = 'fr-FR';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
}
global.SpeechSynthesisUtterance = MockUtterance;

const mockSpeak = vi.fn((utterance) => {
  // Simulate onstart immediately
  if (utterance.onstart) utterance.onstart();
});
const mockCancel = vi.fn();

Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: { speak: mockSpeak, cancel: mockCancel },
});

beforeEach(() => vi.clearAllMocks());

describe('ReadCardButton', () => {
  it('renders a button with aria-label', () => {
    render(<ReadCardButton text="Hello world" />);
    const btn = screen.getByRole('button');
    expect(btn).toBeDefined();
    expect(btn.getAttribute('aria-label')).toBe('Lire ce contenu');
  });

  it('calls speechSynthesis.speak when clicked', () => {
    render(<ReadCardButton text="Read this text" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSpeak).toHaveBeenCalledOnce();
  });

  it('passes the correct text to SpeechSynthesisUtterance', () => {
    render(<ReadCardButton text="My card content" />);
    fireEvent.click(screen.getByRole('button'));
    const utterance = mockSpeak.mock.calls[0][0];
    expect(utterance.text).toBe('My card content');
  });

  it('calls speechSynthesis.cancel when clicked while reading', () => {
    render(<ReadCardButton text="Read this text" />);
    const btn = screen.getByRole('button');
    // First click — starts reading (mockSpeak triggers onstart)
    fireEvent.click(btn);
    expect(mockSpeak).toHaveBeenCalledOnce();
    // Second click — should cancel
    fireEvent.click(btn);
    expect(mockCancel).toHaveBeenCalledOnce();
  });

  it('stops propagation on click (does not bubble to parent)', () => {
    const parentClick = vi.fn();
    render(
      <div onClick={parentClick}>
        <ReadCardButton text="test" />
      </div>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it('renders with size="md" larger class', () => {
    render(<ReadCardButton text="test" size="md" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-9');
  });

  it('renders with size="sm" smaller class by default', () => {
    render(<ReadCardButton text="test" />);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-7');
  });

  it('does not speak when text is empty', () => {
    render(<ReadCardButton text="" />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockSpeak).not.toHaveBeenCalled();
  });
});
