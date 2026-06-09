---
source: https://github.com/signalityjs/signality/blob/main/projects/core/browser/document-picture-in-picture/index.ts
---

# documentPictureInPicture

Signal-based wrapper around the [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture). Allows any HTML element to be displayed in an always-on-top PiP window — not just `<video>` elements.

## Usage

```typescript
import { documentPictureInPicture } from '@signality/core/browser';

@Component({
  template: `
    @if (pip.isSupported()) {
      <div #content>
        <p>This content can be displayed in a PiP window</p>
      </div>
      <button (click)="pip.toggle()">Toggle PiP</button>
      <p>Active: {{ pip.isActive() }}</p>
    }
  `
})
export class DocumentPiPDemo {
  readonly content = viewChild<ElementRef>('content');
  readonly pip = documentPictureInPicture(this.content, {
    width: 400,
    height: 300,
  });
}
```

## Parameters

| Parameter | Type | Description |
|---|---|---|
| `target` | `MaybeElementSignal<HTMLElement>` | The element to display in the PiP window |
| `options` | `DocumentPictureInPictureOptions` | Optional configuration |

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `width` | `number` | — | Initial width of the PiP window in pixels |
| `height` | `number` | — | Initial height of the PiP window in pixels |
| `disallowReturnToOpener` | `boolean` | `false` | Hide the "back to tab" button (Chrome 124+) |
| `preferInitialWindowPlacement` | `boolean` | `false` | Open at default position/size instead of remembering previous (Chrome 130+) |
| `injector` | `Injector` | Current injector | Custom injector for dependency injection |

## Return Value

| Property | Type | Description |
|---|---|---|
| `isSupported` | `Signal<boolean>` | Whether the Document Picture-in-Picture API is supported |
| `isActive` | `Signal<boolean>` | Whether the PiP window is currently open |
| `window` | `Signal<Window \| null>` | The current PiP window, or `null` if not active |
| `enter()` | `() => Promise<void>` | Open the PiP window and move the target element into it. Requires a user gesture |
| `exit()` | `() => void` | Close the PiP window and restore the target element |
| `toggle()` | `() => Promise<void>` | Toggle PiP — enters if inactive, exits if active |

## Browser Compatibility

The Document Picture-in-Picture API is supported in Chromium-based browsers and Firefox 151+:

```typescript
@Component({
  template: `
    @if (pip.isSupported()) {
      <!-- PiP controls -->
    } @else {
      <p>Document Picture-in-Picture is not supported in this browser.</p>
    }
  `
})
```

[Can I use: Document Picture-in-Picture](https://caniuse.com/?search=document%20picture%20in%20picture)

## SSR Compatibility

Returns safe defaults on the server:

- `isSupported()` → `false`
- `isActive()` → `false`
- `window()` → `null`
- `enter()` / `exit()` / `toggle()` → no-op

## Type Definitions

```typescript
export interface DocumentPictureInPictureOptions extends WithInjector {
  readonly width?: number;
  readonly height?: number;
  readonly disallowReturnToOpener?: boolean;
  readonly preferInitialWindowPlacement?: boolean;
}

export interface DocumentPictureInPictureRef {
  readonly isSupported: Signal<boolean>;
  readonly isActive: Signal<boolean>;
  readonly window: Signal<Window | null>;
  readonly enter: () => Promise<void>;
  readonly exit: () => void;
  readonly toggle: () => Promise<void>;
}
```

## Related

- [pictureInPicture](/browser/picture-in-picture) — Video-only Picture-in-Picture
