class ToastEventBus {
  constructor() { this.listeners = new Set(); }
  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  emit(type, payload) { this.listeners.forEach(l => { try { l(type, payload); } catch {} }); }
}

const eventBus = new ToastEventBus();
export default eventBus;


