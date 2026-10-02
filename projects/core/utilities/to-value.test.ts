import { computed, signal } from '@angular/core';
import { toValue } from './to-value';

describe('toValue', () => {
  it('unwraps plain values and signals', () => {
    expect(toValue(1)).toBe(1);
    expect(toValue(signal(2))).toBe(2);
  });

  it('tracks every signal when used as an Array#map callback', () => {
    const a = signal(1);
    const b = signal(2);
    const values = computed(() => [a, b].map(toValue));

    expect(values()).toEqual([1, 2]);

    b.set(3);

    expect(values()).toEqual([1, 3]);
  });

  describe('untracked', () => {
    it('does not track the signal', () => {
      const a = signal(1);
      const value = computed(() => toValue.untracked(a));

      expect(value()).toBe(1);

      a.set(2);

      expect(value()).toBe(1);
    });
  });
});
