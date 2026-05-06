import { Injectable } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  icon: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toasts: Toast[] = [];
  private readonly listeners: ((t: Toast[]) => void)[] = [];

  private notify(): void {
    this.listeners.forEach(fn => fn([...this.toasts]));
  }

  subscribe(listener: (t: Toast[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.toasts]);
    return () => {
      const i = this.listeners.indexOf(listener);
      if (i !== -1) this.listeners.splice(i, 1);
    };
  }

  private add(type: ToastType, message: string): void {
    const icons = { success: 'check_circle', error: 'error', info: 'info' };
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.toasts.push({ id, type, message, icon: icons[type] });
    this.notify();
    setTimeout(() => this.remove(id), 3000);
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  success(message: string): void {
    this.add('success', message);
  }

  error(message: string): void {
    this.add('error', message);
  }

  info(message: string): void {
    this.add('info', message);
  }
}
