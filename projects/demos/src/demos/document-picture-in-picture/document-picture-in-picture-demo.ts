import { ChangeDetectionStrategy, Component, ElementRef, viewChild } from '@angular/core';
import { documentPictureInPicture } from '@signality/core';
import { DemoButton, DemoCard, DemoNotSupported, Wrapper } from '../../common';

@Component({
  selector: 'demo-document-picture-in-picture',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Wrapper, DemoCard, DemoButton, DemoNotSupported],
  templateUrl: './document-picture-in-picture-demo.html',
  styleUrl: './document-picture-in-picture-demo.scss',
})
export class DocumentPictureInPictureDemo {
  readonly importCode = `import { documentPictureInPicture } from '@signality/core'`;

  readonly content = viewChild<ElementRef<HTMLElement>>('content');
  readonly pip = documentPictureInPicture(this.content, {
    width: 360,
    height: 240,
  });
  readonly isActive = this.pip.isActive;

  async handleToggle(): Promise<void> {
    await this.pip.toggle();
  }
}
