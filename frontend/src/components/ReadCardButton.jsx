import React, { useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

/**
 * ReadCardButton — reads a specific card's text via TTS.
 *
 * Usage options:
 *   1. Pass `text` prop directly:
 *      <ReadCardButton text="Hello world" />
 *
 *   2. Pass a `targetRef` pointing to the card DOM node:
 *      const ref = useRef();
 *      <div ref={ref}>...</div>
 *      <ReadCardButton targetRef={ref} />
 *
 *   3. Pass a `targetId` (DOM element id):
 *      <ReadCardButton targetId="my-card" />
 *
 * Optional props:
 *   - lang: speech language (default 'fr-FR')
 *   - rate: speech rate (default 0.9)
 *   - size: 'sm' | 'md' (default 'sm')
 *   - className: extra classes on the button
 */
export default function ReadCardButton({
  text,
  targetRef,
  targetId,
  lang = 'fr-FR',
  rate = 0.9,
  size = 'sm',
  className = '',
}) {
  const [reading, setReading] = useState(false);
  const utteranceRef = useRef(null);

  const getContent = () => {
    if (text) return text;
    if (targetRef?.current) return targetRef.current.innerText || '';
    if (targetId) return document.getElementById(targetId)?.innerText || '';
    return '';
  };

  const toggle = (e) => {
    e.stopPropagation(); // don't bubble to card click handlers
    if (reading) {
      window.speechSynthesis.cancel();
      setReading(false);
      return;
    }
    const content = getContent().replace(/\s+/g, ' ').trim();
    if (!content) return;

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setReading(true);
    utterance.onend   = () => setReading(false);
    utterance.onerror = () => setReading(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const sizeClasses = size === 'sm'
    ? 'h-7 w-7 rounded-lg'
    : 'h-9 w-9 rounded-xl';

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  return (
    <button
      type="button"
      onClick={toggle}
      title={reading ? 'Arrêter la lecture' : 'Lire ce contenu'}
      aria-label={reading ? 'Arrêter la lecture' : 'Lire ce contenu'}
      className={`inline-flex shrink-0 items-center justify-center transition-all
        ${sizeClasses}
        ${reading
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600'
        }
        ${className}`}
    >
      {reading
        ? <VolumeX className={iconSize} />
        : <Volume2 className={iconSize} />
      }
    </button>
  );
}
