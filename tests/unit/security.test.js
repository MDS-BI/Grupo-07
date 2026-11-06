import { describe, it, expect } from 'vitest';
import { escapeHtml, setSafeText, safeAttribute, isSafeUrl } from '../../src/security.js';

describe('security helpers', () => {
  it('escapes HTML special characters', () => {
    const escaped = escapeHtml('<script>alert("x")</script>\'`');
    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#39;');
  });

  it('escapes backticks so template markup cannot be injected', () => {
    expect(escapeHtml('`x`')).toBe('&#96;x&#96;');
  });

  it('sets text without interpreting markup', () => {
    const element = { textContent: '' };
    setSafeText(element, '<img src=x onerror=alert(1)>');
    expect(element.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('escapes values used inside attributes', () => {
    const value = safeAttribute('" onmouseover="alert(1)');
    expect(value).not.toContain('"');
    expect(value).toContain('&quot;');
  });

  it('rejects executable URL schemes', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl(' JavaScript:alert(1) ')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isSafeUrl('ftp://example.com/file')).toBe(false);
  });

  it('accepts http, mailto, tel and relative URLs', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com')).toBe(true);
    expect(isSafeUrl('mailto:ventas@example.com')).toBe(true);
    expect(isSafeUrl('tel:+525512345678')).toBe(true);
    expect(isSafeUrl('/productos/1')).toBe(true);
    expect(isSafeUrl('#detalle')).toBe(true);
  });

  it('rejects blank and non-string URLs', () => {
    expect(isSafeUrl('')).toBe(false);
    expect(isSafeUrl(null)).toBe(false);
    expect(isSafeUrl(42)).toBe(false);
  });
});
