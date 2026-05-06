import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import type { Reclamation } from './reclamation.service';

/**
 * When a reclamation is auto-resolved in the same HTTP response as create, the layout may not
 * poll /notifications yet — emit here so the navbar toast appears immediately.
 */
@Injectable({ providedIn: 'root' })
export class ReclamationResolutionNotifyService {
  private readonly bus = new Subject<Reclamation>();

  readonly resolved$ = this.bus.asObservable();

  emitAutoResolved(row: Reclamation): void {
    const st = String(row?.statut ?? '').toUpperCase();
    if (row?.id != null && st === 'RESOLUE' && row.reponseAdmin?.trim()) {
      this.bus.next(row);
    }
  }
}
