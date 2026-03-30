"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';

interface EditableTextProps {
  value: string;
  onChange: (newValue: string) => void;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div' | 'cite' | 'blockquote';
  multiline?: boolean;
  className?: string;
  style?: React.CSSProperties;
  editable?: boolean;
  placeholder?: string;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value, onChange, as: Tag = 'span', multiline = false,
  className = '', style = {}, editable = true, placeholder = 'Click to edit...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => { if (!isEditing) setEditValue(value); }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      inputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleClick = useCallback(() => { if (editable) setIsEditing(true); }, [editable]);
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editValue !== value) onChange(editValue);
  }, [editValue, value, onChange]);
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); (e.target as HTMLElement).blur(); }
    if (e.key === 'Escape') { setEditValue(value); setIsEditing(false); }
  }, [multiline, value]);

  const inputStyle: React.CSSProperties = {
    ...style, width: '100%', background: 'rgba(255,255,255,0.1)',
    border: '2px solid currentColor', borderRadius: '4px', padding: '4px 8px',
    font: 'inherit', fontSize: 'inherit', fontWeight: 'inherit', lineHeight: 'inherit',
    letterSpacing: 'inherit', color: 'inherit', outline: 'none',
    resize: multiline ? 'vertical' : 'none',
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue} onChange={e => setEditValue(e.target.value)}
          onBlur={handleBlur} onKeyDown={handleKeyDown}
          style={{ ...inputStyle, minHeight: '80px' }} className={className} />
      );
    }
    return (
      <input ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text" value={editValue} onChange={e => setEditValue(e.target.value)}
        onBlur={handleBlur} onKeyDown={handleKeyDown}
        style={inputStyle} className={className} />
    );
  }

  return (
    <Tag onClick={handleClick} className={className}
      style={{
        ...style, cursor: editable ? 'text' : 'default',
        borderRadius: '4px', transition: 'outline 0.15s ease',
        outline: '2px solid transparent', outlineOffset: '4px',
      }}
      onMouseEnter={(e: React.MouseEvent<HTMLElement>) => {
        if (editable) (e.currentTarget as HTMLElement).style.outline = '2px dashed rgba(128,128,128,0.3)';
      }}
      onMouseLeave={(e: React.MouseEvent<HTMLElement>) => {
        (e.currentTarget as HTMLElement).style.outline = '2px solid transparent';
      }}
      title={editable ? 'Click to edit' : undefined}>
      {value || placeholder}
    </Tag>
  );
};

export default EditableText;
