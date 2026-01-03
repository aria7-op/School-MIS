import { ToastMessage } from '../components/ToastContainer';
import { NotificationType } from '../types/notification';

class ToastService {
  private listeners: ((toasts: ToastMessage[]) => void)[] = [];
  private toasts: ToastMessage[] = [];
  private nextId = 1;

  subscribe(listener: (toasts: ToastMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  show(type: NotificationType, title: string, message: string, duration?: number) {
    const toast: ToastMessage = {
      id: `toast-${this.nextId++}`,
      type,
      title,
      message,
      duration
    };

    this.toasts.push(toast);
    this.notify();

    // Auto-remove after duration
    if (duration) {
      setTimeout(() => {
        this.remove(toast.id);
      }, duration);
    }

    return toast.id;
  }

  success(title: string, message?: string, duration?: number) {
    return this.show('SUCCESS', title, message || '', duration);
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show('WARNING', title, message || '', duration);
  }

  error(title: string, message?: string, duration?: number) {
    return this.show('ERROR', title, message || '', duration);
  }

  info(title: string, message?: string, duration?: number) {
    return this.show('SYSTEM', title, message || '', duration);
  }

  remove(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }

  getToasts() {
    return [...this.toasts];
  }
}

const toastService = new ToastService();
export default toastService; 