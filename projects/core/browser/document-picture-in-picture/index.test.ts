import { Component, ElementRef, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { documentPictureInPicture } from './index';

describe(documentPictureInPicture.name, () => {
  let mockPipWindow: any;
  let requestWindowSpy: jest.Mock;

  beforeEach(() => {
    mockPipWindow = {
      document: {
        body: { append: jest.fn() },
        head: { appendChild: jest.fn() },
        createElement: (tag: string) => document.createElement(tag),
      },
      close: jest.fn(),
      addEventListener: jest.fn(),
    };

    requestWindowSpy = jest.fn().mockResolvedValue(mockPipWindow);

    (window as any).documentPictureInPicture = {
      requestWindow: requestWindowSpy,
    };
  });

  afterEach(() => {
    delete (window as any).documentPictureInPicture;
    jest.restoreAllMocks();
  });

  @Component({ template: '<div #target>content</div>' })
  class TestComponent {
    readonly target = viewChild<ElementRef<HTMLElement>>('target');
    readonly pip = documentPictureInPicture(this.target);
  }

  const createComponent = () => {
    const fixture = TestBed.createComponent(TestComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  };

  it('should return stub ref when API is not supported', () => {
    delete (window as any).documentPictureInPicture;
    const { component } = createComponent();

    expect(component.pip.isSupported()).toBe(false);
    expect(component.pip.isActive()).toBe(false);
    expect(component.pip.window()).toBeNull();
  });

  it('should detect API support', () => {
    const { component } = createComponent();

    expect(component.pip.isSupported()).toBe(true);
    expect(component.pip.isActive()).toBe(false);
    expect(component.pip.window()).toBeNull();
  });
});
