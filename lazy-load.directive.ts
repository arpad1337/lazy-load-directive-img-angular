import { Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

@Directive({ selector: 'img' })
export class LazyIMGDirective implements OnDestroy {
  constructor(private el: ElementRef) {
    this.onLoad = this.onLoad.bind(this);
    this.onResize = this.onResize.bind(this);
    if (
      this.el.nativeElement.parentElement!.nodeType === 1 &&
      this.el.nativeElement.parentElement!.tagName === 'PICTURE'
    ) {
      this.setProps();
    } else {
      const picture = document.createElement('picture');
      this.el.nativeElement.parentElement!.insertBefore(
        picture,
        this.el.nativeElement
      );
      picture.appendChild(this.el.nativeElement);
      this.setProps();
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.el.nativeElement.onload = null;
  }

  private setProps() {
    if (this.el.nativeElement!.getAttribute('loaded') === 'true') {
      return;
    }
    delete this.el.nativeElement.parentElement!.style.height;
    this.el.nativeElement!.parentElement!.classList.add('spinner');
    this.el.nativeElement!.parentElement!.style.height = 100 + 'px';
    this.el.nativeElement!.style.visibility = 'hidden';
    const supports = 'loading' in HTMLImageElement.prototype;
    if (supports) {
      this.el.nativeElement!.setAttribute('loading', 'lazy');
    }
  }

  @HostListener('load', ['$event'])
  onLoad(_: Event) {
    if (!!this.el.nativeElement) {
      delete this.el.nativeElement.parentElement!.style.height;
      this.el.nativeElement.parentElement!.classList.remove('spinner');
      this.el.nativeElement.parentElement!.style.display = 'block';
      this.el.nativeElement.parentElement!.style.height = `${this.el.nativeElement.height}px`;
      this.el.nativeElement.style.visibility = 'visible';
      this.el.nativeElement.setAttribute('loaded', 'true');
      return true;
    }
    return false;
  }

  @HostListener('window:resize', ['$event'])
  onResize(_: Event) {
    (!!this.el.nativeElement && this.onLoad(_)) ||
      window.removeEventListener('resize', this.onResize);
  }
}

@Directive({
  selector: '[lazyIMGWrapperForDynamicContent]',
})
export class MutationListenerForLazyIMGDirective {
  private observer = new MutationObserver(() =>
    this.runDirectiveOnDynamicNodes()
  );

  constructor(private el: ElementRef) {}

  ngAfterViewInit(): void {
    this.runDirectiveOnDynamicNodes();
    this.registerListenerForDomChanges();
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }

  private runDirectiveOnDynamicNodes() {
    const nodes: HTMLImageElement[] =
      this.el.nativeElement.querySelectorAll('img');
    nodes.forEach((node) => {
      const boundNode = new LazyIMGDirective({ nativeElement: node });
      node.onload = boundNode.onLoad;
      window.addEventListener('resize', boundNode.onResize);
    });
  }

  private registerListenerForDomChanges() {
    const attributes = false;
    const childList = true;
    const subtree = true;
    this.observer.observe(this.el.nativeElement, {
      attributes,
      childList,
      subtree,
    });
  }
}
