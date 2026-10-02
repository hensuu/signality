import { isSignal, untracked as _untracked } from '@angular/core';
import type { MaybeSignal } from '@signality/core/types';

export interface ToValueFn {
  <T>(maybeSignal: MaybeSignal<T>): T;
  untracked: <T>(maybeSignal: MaybeSignal<T>) => T;
}

export const toValue: ToValueFn = (() => {
  // Wrapped so that the internal `untracked` flag is never set by a caller passing extra
  // arguments, e.g. the index when used as an `Array#map` callback
  const fn = (<T>(v: MaybeSignal<T>) => toValueFn(v)) as ToValueFn;
  fn.untracked = v => toValueFn(v, true);
  return fn;
})();

function toValueFn<T>(maybeSignal: MaybeSignal<T>, untracked = false): T {
  if (isSignal(maybeSignal)) {
    return untracked ? _untracked(maybeSignal) : maybeSignal();
  }
  return maybeSignal;
}
