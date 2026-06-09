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

  it('should call requestWindow with options on enter', async () => {
    @Component({ template: '<div #target>content</div>' })
    class OptionsComponent {
      readonly target = viewChild<ElementRef<HTMLElement>>('target');
      readonly pip = documentPictureInPicture(this.target, {
        width: 400,
        height: 300,
        disallowReturnToOpener: true,
        preferInitialWindowPlacement: true,
      });
    }

    const fixture = TestBed.createComponent(OptionsComponent);
    fixture.detectChanges();

    await fixture.componentInstance.pip.enter();

    expect(requestWindowSpy).toHaveBeenCalledWith({
      width: 400,
      height: 300,
      disallowReturnToOpener: true,
      preferInitialWindowPlacement: true,
    });
  });

  it('should move target element into PiP window on enter', async () => {
    const { component } = createComponent();

    await component.pip.enter();

    expect(mockPipWindow.document.body.append).toHaveBeenCalledWith(
      expect.any(HTMLElement)
    );
  });

  it('should update signals after enter', async () => {
    const { component } = createComponent();

    await component.pip.enter();

    expect(component.pip.isActive()).toBe(true);
    expect(component.pip.window()).toBe(mockPipWindow);
  });

  it('should close PiP window and reset signals on exit', async () => {
    const { component } = createComponent();

    await component.pip.enter();
    component.pip.exit();

    expect(mockPipWindow.close).toHaveBeenCalled();
    expect(component.pip.isActive()).toBe(false);
    expect(component.pip.window()).toBeNull();
  });

  it('should be a no-op when exit is called while inactive', () => {
    const { component } = createComponent();

    component.pip.exit();

    expect(mockPipWindow.close).not.toHaveBeenCalled();
  });

  it('should enter on toggle when inactive', async () => {
    const { component } = createComponent();

    await component.pip.toggle();

    expect(component.pip.isActive()).toBe(true);
  });

  it('should exit on toggle when active', async () => {
    const { component } = createComponent();

    await component.pip.enter();
    await component.pip.toggle();

    expect(component.pip.isActive()).toBe(false);
    expect(mockPipWindow.close).toHaveBeenCalled();
  });
});
