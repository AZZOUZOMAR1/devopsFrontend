import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * When a student creates/updates a reclamation in one tab, other tabs (e.g. admin backoffice)
 * can refresh immediately without waiting for the poll interval.
 */
@Injectable({ providedIn: 'root' })
export class ReclamationListSyncService {
  private readonly bus = new Subject<void>();
  private bc: BroadcastChannel | null = null;

  /** Stream of "data may have changed" — subscribe and reload the admin list. */
  readonly listChanged$ = this.bus.asObservable();

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {
    if (isPlatformBrowser(this.platformId) && typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel('slang-reclamation-crud');
      this.bc.addEventListener('message', () => this.bus.next());
    }
  }

  /** Call after successful create / update / delete on reclamations. */
  notifyListChanged(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    this.bus.next();
    try {
      this.bc?.postMessage({ t: Date.now() });
    } catch {
      /* ignore */
    }
  }
}
