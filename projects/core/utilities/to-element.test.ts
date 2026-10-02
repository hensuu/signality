import { computed, ElementRef, signal } from '@angular/core';
import { toElement } from './to-element';

describe('toElement', () => {
  it('unwraps elements, element refs and signals', () => {
    const el = document.createElement('div');

    expect(toElement(el)).toBe(el);
    expect(toElement(new ElementRef(el))).toBe(el);
    expect(toElement(signal(new ElementRef(el)))).toBe(el);
  });

  it('tracks every signal when used as an Array#map callback', () => {
    const first = document.createElement('div');
    const second = document.createElement('span');
    const a = signal<HTMLElement | null>(first);
    const b = signal<HTMLElement | null>(null);
    const els = computed(() => [a, b].map(toElement));

    expect(els()).toEqual([first, null]);

    b.set(second);

    expect(els()).toEqual([first, second]);
  });

  describe('untracked', () => {
    it('does not track the signal', () => {
      const first = document.createElement('div');
      const a = signal<HTMLElement | null>(first);
      const el = computed(() => toElement.untracked(a));

      expect(el()).toBe(first);

      a.set(null);

      expect(el()).toBe(first);
    });
  });
});
