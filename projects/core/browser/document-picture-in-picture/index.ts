import { computed, DestroyRef, inject, type Signal, signal, untracked } from '@angular/core';
import { assertElement, constSignal, NOOP_ASYNC_FN, NOOP_FN, setupContext } from '@signality/core/internal';
import { toElement } from '@signality/core/utilities';
import type { MaybeElementSignal, WithInjector } from '@signality/core/types';

export interface DocumentPictureInPictureOptions extends WithInjector {
  /**
   * Initial width of the PiP window in pixels.
   */
  readonly width?: number;

  /**
   * Initial height of the PiP window in pixels.
   */
  readonly height?: number;

  /**
   * Hide the "back to tab" button in the PiP window.
   *
   * @default false
   * @see [Chrome 124+](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)
   */
  readonly disallowReturnToOpener?: boolean;

  /**
   * Open at default position/size instead of remembering previous.
   *
   * @default false
   * @see [Chrome 130+](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)
   */
  readonly preferInitialWindowPlacement?: boolean;
}

export interface DocumentPictureInPictureRef {
  /**
   * Whether the Document Picture-in-Picture API is supported in the current browser.
   *
   * @see [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture)
   */
  readonly isSupported: Signal<boolean>;

  /**
   * Whether the PiP window is currently open.
   */
  readonly isActive: Signal<boolean>;

  /**
   * The current PiP window, or `null` if not active.
   */
  readonly window: Signal<Window | null>;

  /**
   * Open the PiP window and move the target element into it. Requires a user gesture.
   *
   * @see [DocumentPictureInPicture: requestWindow() on MDN](https://developer.mozilla.org/en-US/docs/Web/API/DocumentPictureInPicture/requestWindow)
   */
  readonly enter: () => Promise<void>;

  /**
   * Close the PiP window and move the target element back to its original position.
   */
  readonly exit: () => void;

  /**
   * Toggle Picture-in-Picture mode — enters if inactive, exits if active.
   */
  readonly toggle: () => Promise<void>;
}

/**
 * Signal-based wrapper around the [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture).
 *
 * Moves the target element into an always-on-top PiP window and restores it
 * when the window is closed. Automatically copies stylesheets from the parent document.
 *
 * @param target - Element to display in the PiP window
 * @param options - Optional configuration
 * @returns A {@link DocumentPictureInPictureRef} with `isSupported`, `isActive`, `window` signals and `enter`/`exit`/`toggle` methods
 *
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     @if (pip.isSupported()) {
 *       <div #content>
 *         <p>This content can be displayed in a PiP window</p>
 *       </div>
 *       <button (click)="pip.toggle()">Toggle PiP</button>
 *       <p>Active: {{ pip.isActive() }}</p>
 *     }
 *   `
 * })
 * export class DocumentPiPDemo {
 *   readonly content = viewChild<ElementRef>('content');
 *   readonly pip = documentPictureInPicture(this.content, {
 *     width: 400,
 *     height: 300,
 *   });
 * }
 * ```
 */
export function documentPictureInPicture(
  target: MaybeElementSignal<HTMLElement>,
  options?: DocumentPictureInPictureOptions
): DocumentPictureInPictureRef {
  const { runInContext } = setupContext(options?.injector, documentPictureInPicture);

  return runInContext(({ isBrowser, onCleanup }) => {
    const isSupported = constSignal(
      isBrowser && 'documentPictureInPicture' in window
    );

    if (!isSupported()) {
      return {
        isSupported,
        isActive: constSignal(false),
        window: constSignal(null),
        enter: NOOP_ASYNC_FN,
        exit: NOOP_FN,
        toggle: NOOP_ASYNC_FN,
      };
    }

    const pipWindow = signal<Window | null>(null);
    const isActive = computed(() => pipWindow() !== null);

    return {
      isSupported,
      isActive,
      window: pipWindow.asReadonly(),
      enter: NOOP_ASYNC_FN,
      exit: NOOP_FN,
      toggle: NOOP_ASYNC_FN,
    };
  });
}
