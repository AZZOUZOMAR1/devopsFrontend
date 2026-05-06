import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent {
  @Input() totalItems = 0;
  @Input() pageSize = 10;
  @Input() currentPage = 1;
  @Input() pageSizeOptions: number[] = [5, 10, 25, 50];
  @Output() pageChange = new EventEmitter<number>();
  @Output() pageSizeChange = new EventEmitter<number>();

  get totalPages(): number {
    if (this.pageSize <= 0) return 0;
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get startIndex(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  get hasPrev(): boolean {
    return this.currentPage > 1;
  }

  get hasNext(): boolean {
    return this.currentPage < this.totalPages;
  }

  goToPage(page: number): void {
    const p = Math.max(1, Math.min(page, this.totalPages));
    if (p !== this.currentPage) {
      this.currentPage = p;
      this.pageChange.emit(p);
    }
  }

  onPageSizeChange(size: number): void {
    this.pageSizeChange.emit(size);
    this.goToPage(1);
  }
}
