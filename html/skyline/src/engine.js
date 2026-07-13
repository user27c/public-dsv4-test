const listeners = {};

export const EventBus = {
  on(event, fn) {
    (listeners[event] ||= []).push(fn);
    return () => this.off(event, fn);
  },
  off(event, fn) {
    const arr = listeners[event];
    if (arr) listeners[event] = arr.filter(f => f !== fn);
  },
  emit(event, data) {
    for (const fn of listeners[event] || []) fn(data);
  },
};
