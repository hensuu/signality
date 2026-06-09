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

  it('should restore element and reset signals on pagehide', async () => {
    const { component } = createComponent();

    await component.pip.enter();

    const pagehideCall = mockPipWindow.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'pagehide'
    );
    expect(pagehideCall).toBeDefined();

    const pagehideHandler = pagehideCall[1];
    pagehideHandler();

    expect(component.pip.isActive()).toBe(false);
    expect(component.pip.window()).toBeNull();
  });

  it('should register pagehide listener with once option', async () => {
    const { component } = createComponent();

    await component.pip.enter();

    expect(mockPipWindow.addEventListener).toHaveBeenCalledWith(
      'pagehide',
      expect.any(Function),
      { once: true }
    );
  });

  it('should close previous PiP window when enter is called while active', async () => {
    const { component } = createComponent();

    await component.pip.enter();

    const firstWindow = { ...mockPipWindow, close: jest.fn(), addEventListener: jest.fn() };
    const secondWindow = { ...mockPipWindow, close: jest.fn(), addEventListener: jest.fn() };

    requestWindowSpy
      .mockResolvedValueOnce(firstWindow)
      .mockResolvedValueOnce(secondWindow);

    mockPipWindow = firstWindow;
    await component.pip.enter();

    mockPipWindow = secondWindow;
    await component.pip.enter();

    expect(firstWindow.close).toHaveBeenCalled();
    expect(component.pip.window()).toBe(secondWindow);
  });

  it('should close PiP window when component is destroyed during enter', async () => {
    let resolveWindow!: (win: any) => void;
    requestWindowSpy.mockReturnValue(new Promise(resolve => {
      resolveWindow = resolve;
    }));

    const { fixture, component } = createComponent();

    const enterPromise = component.pip.enter();
    fixture.destroy();

    resolveWindow(mockPipWindow);
    await enterPromise;

    expect(mockPipWindow.close).toHaveBeenCalled();
  });

  it('should close PiP window on cleanup', async () => {
    const { fixture, component } = createComponent();

    await component.pip.enter();
    fixture.destroy();

    expect(mockPipWindow.close).toHaveBeenCalled();
  });

  it('should copy same-origin stylesheets as inline styles', async () => {
    const mockCssRule = { cssText: '.test { color: red; }' };
    const mockStyleSheet = {
      cssRules: [mockCssRule],
      href: null,
    };
    jest.spyOn(document, 'styleSheets', 'get').mockReturnValue([mockStyleSheet] as any);

    const { component } = createComponent();
    await component.pip.enter();

    expect(mockPipWindow.document.head.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({ textContent: '.test { color: red; }' })
    );
  });

  it('should copy cross-origin stylesheets as link elements', async () => {
    const mockStyleSheet = {
      get cssRules() {
        throw new DOMException('SecurityError');
      },
      href: 'https://cdn.example.com/styles.css',
      type: 'text/css',
      media: { mediaText: 'screen' },
    };
    jest.spyOn(document, 'styleSheets', 'get').mockReturnValue([mockStyleSheet] as any);

    const { component } = createComponent();
    await component.pip.enter();

    expect(mockPipWindow.document.head.appendChild).toHaveBeenCalledWith(
      expect.objectContaining({
        rel: 'stylesheet',
        href: 'https://cdn.example.com/styles.css',
        type: 'text/css',
        media: 'screen',
      })
    );
  });
});
