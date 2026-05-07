import {
  Component,
  computed,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TreeSelectModule } from 'primeng/treeselect';
import { TreeNode } from 'primeng/api';
import { Category, CategoryType, GROUP_ICONS } from '../../../core/models/category.model';

@Component({
  selector: 'app-category-select',
  standalone: true,
  imports: [CommonModule, FormsModule, TreeSelectModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CategorySelectComponent),
      multi: true,
    },
  ],
  template: `
    <p-treeselect
      [options]="treeOptions()"
      [ngModel]="selectedNode()"
      (ngModelChange)="onNodeChange($event)"
      (onBlur)="onTouched()"
      selectionMode="single"
      [filter]="true"
      [showClear]="showClear()"
      [fluid]="fluid()"
      [placeholder]="placeholder()"
      [disabled]="isDisabled()"
      styleClass="cat-treeselect"
      panelStyleClass="cat-tree-panel"
    >
      <ng-template #value let-node>
        @if (selectedCategory(); as cat) {
          <div class="cat-selected">
            <span class="cat-dot" [style.background]="cat.color"></span>
            <span class="cat-emoji">{{ cat.icon }}</span>
            <span class="cat-label">{{ cat.name }}</span>
          </div>
        } @else {
          <span class="cat-placeholder">{{ placeholder() }}</span>
        }
      </ng-template>
    </p-treeselect>
  `,
  styles: [`
    :host { display: block; }

    /* ── Selected display ──────────────────────────── */
    .cat-selected {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .cat-placeholder {
      color: var(--p-select-placeholder-color, var(--text-color-secondary));
    }

    .cat-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .cat-emoji { font-size: 1rem; line-height: 1; }
    .cat-label { font-size: 0.9rem; }

    /* ── Tree panel items ──────────────────────────── */
    ::ng-deep .cat-tree-panel {

      /* Group header nodes (non-selectable) */
      .p-tree-node-selectable:not([aria-selected]) > .p-tree-node-content,
      .p-treeselect-list .p-tree-node:not(.p-tree-node-leaf) > .p-tree-node-content {
        font-weight: 700;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--text-color-secondary);
        cursor: default;
      }

      /* Leaf item hover */
      .p-tree-node-leaf > .p-tree-node-content:hover {
        background: var(--surface-hover);
      }
    }
  `],
})
export class CategorySelectComponent implements ControlValueAccessor {
  categories  = input<Category[]>([]);
  type        = input<CategoryType | null>(null);
  placeholder = input('Selecciona una categoría');
  showClear   = input(true);
  fluid       = input(true);

  private _id = signal<string | null>(null);
  isDisabled  = signal(false);

  onChange  = (_: string | null) => {};
  onTouched = () => {};

  /** Build the TreeNode array — group nodes (not selectable) + leaf category nodes */
  treeOptions = computed<TreeNode[]>(() => {
    const filterType = this.type();
    const cats = filterType
      ? this.categories().filter((c) => c.type === filterType)
      : this.categories();

    const map = new Map<string, Category[]>();
    for (const cat of cats) {
      const g = cat.group ?? 'Otros';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(cat);
    }

    return Array.from(map.entries()).map(([groupName, items]) => ({
      key:        `grp__${groupName}`,
      label:      `${GROUP_ICONS[groupName] ?? '📁'}  ${groupName}`,
      selectable: false,
      expanded:   false,
      children:   items.map((cat) => ({
        key:      cat.id,
        label:    `${cat.icon}  ${cat.name}`,
        data:     cat,
        leaf:     true,
        selectable: true,
      })),
    }));
  });

  /** Flat map of all leaf nodes keyed by category ID for fast lookup */
  private leafMap = computed(() => {
    const m = new Map<string, TreeNode>();
    for (const group of this.treeOptions()) {
      for (const leaf of group.children ?? []) {
        m.set(leaf.key as string, leaf);
      }
    }
    return m;
  });

  /** The TreeNode currently selected (for ngModel on p-treeselect) */
  selectedNode = computed<TreeNode | null>(() => {
    const id = this._id();
    return id ? (this.leafMap().get(id) ?? null) : null;
  });

  /** The Category object — used by the #value template for rich display */
  selectedCategory = computed<Category | null>(() => {
    const id = this._id();
    if (!id) return null;
    const node = this.leafMap().get(id);
    return (node?.data as Category) ?? null;
  });

  // ── ControlValueAccessor ─────────────────────────────────────────────────
  writeValue(id: string | null): void { this._id.set(id ?? null); }
  registerOnChange(fn: (_: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }

  onNodeChange(node: TreeNode | null): void {
    const id = (node?.key as string) ?? null;
    // Ignore clicks on group headers (key starts with 'grp__')
    if (id?.startsWith('grp__')) return;
    this._id.set(id);
    this.onChange(id);
    this.onTouched();
  }
}
