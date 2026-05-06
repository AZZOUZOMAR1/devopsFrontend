import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class VisitorService {

  /** Génère un ID numérique unique par navigateur (stocké dans localStorage, utilisé comme studentId). */
  getVisitorId(): number {
    if (typeof window === 'undefined') return 0;
    let id = localStorage.getItem('visitorId');
    if (!id) {
      // Combinaison timestamp + aléatoire pour réduire les collisions tout en restant un nombre.
      const now = Date.now();
      const rand = Math.floor(Math.random() * 1_000_000);
      id = String((now % 1_000_000_000) + rand);
      localStorage.setItem('visitorId', id);
    }
    return Number(id);
  }
}