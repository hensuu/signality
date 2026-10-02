import { Component, ElementRef, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { mutationObserver } from './index';

describe(mutationObserver.name, () => {
  @Component({
    template: `
      <div #first></div>
      @if (showSecond()) {
      <div #second></div>
      }
    `,
  })
  class HostComponent {
    readonly showSecond = signal(false);
    readonly first = viewChild<ElementRef<HTMLElement>>('first');
    readonly second = viewChild<ElementRef<HTMLElement>>('second');
    readonly records: MutationRecord[] = [];

    constructor() {
      mutationObserver([this.first, this.second], records => this.records.push(...records), {
        attributes: true,
      });
    }
  }

  function flushMutations() {
    return new Promise(resolve => setTimeout(resolve));
  }

  it('observes every target of an array', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const first = component.first()!.nativeElement;

    first.setAttribute('data-test', '1');
    await flushMutations();

    expect(component.records.map(r => r.target)).toEqual([first]);
  });

  it('starts observing a later target once it is rendered', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.showSecond.set(true);
    fixture.detectChanges();

    const second = component.second()!.nativeElement;

    second.setAttribute('data-test', '1');
    await flushMutations();

    expect(component.records.map(r => r.target)).toEqual([second]);
  });
});
