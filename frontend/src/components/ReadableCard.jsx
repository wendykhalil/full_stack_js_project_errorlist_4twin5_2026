import React, { useRef } from 'react';
import ReadCardButton from './ReadCardButton';

/**
 * ReadableCard — drop-in wrapper that adds a TTS button to any card.
 *
 * Usage:
 *   <ReadableCard className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
 *     <h2>Title</h2>
 *     <p>Content...</p>
 *   </ReadableCard>
 *
 * Props:
 *   - as: element type (default 'div')
 *   - btnSize: 'sm' | 'md' (default 'sm')
 *   - btnClass: extra classes on the button
 *   - All other props forwarded to the wrapper element
 */
export default function ReadableCard({
  as: Tag = 'div',
  children,
  className = '',
  btnSize = 'sm',
  btnClass = '',
  ...props
}) {
  const ref = useRef();
  return (
    <Tag ref={ref} className={`relative ${className}`} {...props}>
      <ReadCardButton
        targetRef={ref}
        size={btnSize}
        className={`absolute right-3 top-3 z-10 opacity-0 transition-opacity group-hover:opacity-100 ${btnClass}`}
      />
      {children}
    </Tag>
  );
}
