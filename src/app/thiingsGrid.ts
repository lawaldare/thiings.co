import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
  NgModule,
  HostListener,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';

type Position = { x: number; y: number };
type GridItem = { position: Position; gridIndex: number };

export interface ItemConfig {
  isMoving: boolean;
  position: Position;
  gridIndex: number;
}

/* Physics constants copied from your React version */
const MIN_VELOCITY = 0.2;
const UPDATE_INTERVAL = 16;
const VELOCITY_HISTORY_SIZE = 5;
const FRICTION = 0.9;
const VELOCITY_THRESHOLD = 0.3;

/* Small debounce/throttle utilities (kept simple) */
function debounce<T extends (...a: any[]) => void>(fn: T, wait = 200) {
  let t: any = null;
  const wrapped = (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => {
      fn(...args);
      t = null;
    }, wait);
  };
  wrapped.cancel = () => {
    if (t) clearTimeout(t);
    t = null;
  };
  return wrapped as typeof wrapped & { cancel: () => void };
}

function throttle<T extends (...a: any[]) => void>(fn: T, limit = 16) {
  let last = 0;
  let t: any = null;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= limit) {
      last = now;
      fn(...args);
    } else {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        last = Date.now();
        fn(...args);
        t = null;
      }, limit - (now - last));
    }
  }) as T;
}

function getDistance(a: Position, b: Position) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

@Component({
  selector: 'app-thiings-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div
      #container
      class="thiings-grid-container"
      (mousedown)="onMouseDown($event)"
      (mousemove)="onMouseMove($event)"
      (mouseup)="onMouseUp()"
      (mouseleave)="onMouseUp()"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
      (wheel)="onWheel($event)"
      [class.dragging]="isDragging"
    >
      <div
        class="thiings-grid-inner"
        [style.transform]="'translate3d(' + offset.x + 'px,' + offset.y + 'px,0)'"
      >
        <ng-container *ngFor="let item of gridItems; trackBy: trackByPos">
          <div
            class="grid-item"
            [style.width.px]="gridSize"
            [style.height.px]="gridSize"
            [style.transform]="computeTransform(item.position)"
            [style.marginLeft.px]="-gridSize / 2"
            [style.marginTop.px]="-gridSize / 2"
          >
            <!-- render the passed ng-template with item as implicit context -->
            <ng-container
              *ngTemplateOutlet="
                itemTemplate ? itemTemplate : defaultTpl;
                context: {
                  $implicit: {
                    gridIndex: item.gridIndex,
                    position: item.position,
                    isMoving: isMoving
                  }
                }
              "
            ></ng-container>
          </div>
        </ng-container>
      </div>
    </div>

    <ng-template #defaultTpl let-item>
      <div class="absolute inset-1 flex items-center justify-center">
        {{ item.gridIndex }}
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      .thiings-grid-container {
        position: absolute;
        inset: 0;
        touch-action: none;
        overflow: hidden;
        cursor: grab;
      }
      .thiings-grid-container.dragging {
        cursor: grabbing;
      }
      .thiings-grid-inner {
        position: absolute;
        inset: 0;
        will-change: transform;
      }
      .grid-item {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        user-select: none;
        will-change: transform;
      }
    `,
  ],
})
export class ThiingsGridComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() gridSize = 80;
  /** Pass an ng-template that receives ItemConfig as implicit context: let-item */
  @Input() itemTemplate?: TemplateRef<{ $implicit: ItemConfig }>;
  @Input() initialPosition: Position = { x: 0, y: 0 };

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLElement>;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['gridSize'] && !changes['gridSize'].firstChange) {
      this.updateGridItems(); // recalc when gridSize changes
    }
  }

  offset: Position = { x: 0, y: 0 };
  restPos: Position = { x: 0, y: 0 };
  startPos: Position = { x: 0, y: 0 };
  velocity: Position = { x: 0, y: 0 };
  isDragging = false;
  isMoving = false;
  lastMoveTime = 0;
  velocityHistory: Position[] = [];
  gridItems: GridItem[] = [];

  private lastPos: Position = { x: 0, y: 0 };
  private animationFrame: number | null = null;
  private isMounted = false;
  private lastUpdateTime = 0;

  private debouncedStopMoving = debounce(() => {
    this.isMoving = false;
    this.restPos = { ...this.offset };
  }, 200);

  private throttledUpdate = throttle(() => this.updateGridItems(), UPDATE_INTERVAL);

  containerWidth = 0;
  containerHeight = 0;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    this.offset = { ...this.initialPosition };
    this.restPos = { ...this.initialPosition };
  }

  ngAfterViewInit(): void {
    this.isMounted = true;
    // compute initial dimensions and items
    this.updateContainerSize();
    this.updateGridItems();

    // add passive: false for wheel/touchmove if needed (we're using template bound events)
    // If you need non-passive native events, you'd add them via addEventListener on containerRef.nativeElement
  }

  ngOnDestroy(): void {
    this.isMounted = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    (this.debouncedStopMoving as any).cancel?.();
  }

  /* ---------- Event handlers ---------- */
  onMouseDown(e: MouseEvent) {
    this.startDrag({ x: e.clientX, y: e.clientY });
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDragging) return;
    e.preventDefault();
    this.doMove({ x: e.clientX, y: e.clientY });
  }

  onMouseUp() {
    this.endDrag();
  }

  onTouchStart(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    this.startDrag({ x: t.clientX, y: t.clientY });
  }

  onTouchMove(e: TouchEvent) {
    if (!this.isDragging) return;
    const t = e.touches[0];
    if (!t) return;
    e.preventDefault();
    this.doMove({ x: t.clientX, y: t.clientY });
  }

  onTouchEnd() {
    this.endDrag();
  }

  onWheel(e: WheelEvent) {
    // Prevent page scroll
    e.preventDefault();
    this.offset.x -= e.deltaX;
    this.offset.y -= e.deltaY;
    this.velocity = { x: 0, y: 0 };
    this.throttledUpdate();
  }

  private startDrag(p: Position) {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.isDragging = true;
    this.startPos = { x: p.x - this.offset.x, y: p.y - this.offset.y };
    this.velocity = { x: 0, y: 0 };
    this.lastPos = { x: p.x, y: p.y };
    this.lastMoveTime = performance.now();
  }

  private doMove(p: Position) {
    const now = performance.now();
    const dt = now - this.lastMoveTime || 1;

    const rawVel = { x: (p.x - this.lastPos.x) / dt, y: (p.y - this.lastPos.y) / dt };

    // maintain history and smooth
    this.velocityHistory.push(rawVel);
    if (this.velocityHistory.length > VELOCITY_HISTORY_SIZE) this.velocityHistory.shift();

    const smoothed = this.velocityHistory.reduce(
      (acc, v) => ({
        x: acc.x + v.x / this.velocityHistory.length,
        y: acc.y + v.y / this.velocityHistory.length,
      }),
      { x: 0, y: 0 }
    );

    this.velocity = smoothed;

    this.offset = { x: p.x - this.startPos.x, y: p.y - this.startPos.y };
    this.lastMoveTime = now;
    this.lastPos = p;

    this.updateGridItems();
    this.isMoving = getDistance(this.offset, this.restPos) > 5;
    this.debouncedStopMoving();
  }

  private endDrag() {
    this.isDragging = false;
    // start inertia animation
    this.animate();
  }

  /* ---------- Animation ---------- */
  private animate = () => {
    if (!this.isMounted) return;
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastUpdateTime;

    if (deltaTime >= UPDATE_INTERVAL) {
      const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);

      if (speed < MIN_VELOCITY) {
        this.velocity = { x: 0, y: 0 };
        this.lastUpdateTime = currentTime;
        return;
      }

      let deceleration = FRICTION;
      if (speed < VELOCITY_THRESHOLD) {
        deceleration = FRICTION * (speed / VELOCITY_THRESHOLD);
      }

      this.offset = {
        x: this.offset.x + this.velocity.x,
        y: this.offset.y + this.velocity.y,
      };

      this.velocity = {
        x: this.velocity.x * deceleration,
        y: this.velocity.y * deceleration,
      };

      this.lastUpdateTime = currentTime;
      this.updateGridItems();
      this.isMoving = getDistance(this.offset, this.restPos) > 5;
      this.debouncedStopMoving();
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  };

  /* ---------- Grid computation ---------- */
  private updateContainerSize() {
    const el = this.containerRef?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    this.containerWidth = rect.width;
    this.containerHeight = rect.height;
  }

  private updateGridItems() {
    this.updateContainerSize();

    const positions = this.calculateVisiblePositions();
    this.gridItems = positions.map((position) => ({
      position,
      gridIndex: this.getItemIndexForPosition(position.x, position.y),
    }));
  }

  private calculateVisiblePositions(): Position[] {
    const el = this.containerRef?.nativeElement;
    if (!el) return [];
    const cellsX = Math.ceil(this.containerWidth / this.gridSize);
    const cellsY = Math.ceil(this.containerHeight / this.gridSize);

    const centerX = -Math.round(this.offset.x / this.gridSize);
    const centerY = -Math.round(this.offset.y / this.gridSize);

    const positions: Position[] = [];
    const halfCellsX = Math.ceil(cellsX / 2);
    const halfCellsY = Math.ceil(cellsY / 2);

    for (let y = centerY - halfCellsY; y <= centerY + halfCellsY; y++) {
      for (let x = centerX - halfCellsX; x <= centerX + halfCellsX; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  private getItemIndexForPosition(x: number, y: number): number {
    if (x === 0 && y === 0) return 0;
    const layer = Math.max(Math.abs(x), Math.abs(y));
    const innerLayersSize = Math.pow(2 * layer - 1, 2);

    let positionInLayer = 0;
    if (y === 0 && x === layer) positionInLayer = 0;
    else if (y < 0 && x === layer) positionInLayer = -y;
    else if (y === -layer && x > -layer) positionInLayer = layer + (layer - x);
    else if (x === -layer && y < layer) positionInLayer = 3 * layer + (layer + y);
    else if (y === layer && x < layer) positionInLayer = 5 * layer + (layer + x);
    else positionInLayer = 7 * layer + (layer - y);

    return innerLayersSize + positionInLayer;
  }

  /* ---------- Helpers ---------- */
  computeTransform(pos: Position) {
    // place relative to center of container
    const x = pos.x * this.gridSize + this.containerWidth / 2;
    const y = pos.y * this.gridSize + this.containerHeight / 2;
    return `translate3d(${x}px, ${y}px, 0)`;
  }

  trackByPos(_: number, item: GridItem) {
    return `${item.position.x}-${item.position.y}`;
  }
}

/* Optional NgModule export if you prefer to import this component via a module (not required for standalone imports) */
@NgModule({
  imports: [ThiingsGridComponent],
  exports: [ThiingsGridComponent],
})
export class ThiingsGridModule {}
