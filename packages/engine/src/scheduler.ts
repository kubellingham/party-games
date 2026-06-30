/** Schedules server-side game timers. Abstracted so it can be backed by setTimeout now and a
 * durable/cluster-aware scheduler later without changing the runtime. */
export interface TimerScheduler {
  set(id: string, delayMs: number, fire: () => void): void;
  cancel(id: string): void;
  cancelAll(): void;
}

export class NodeTimerScheduler implements TimerScheduler {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  set(id: string, delayMs: number, fire: () => void): void {
    this.cancel(id);
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id);
        fire();
      }, delayMs),
    );
  }

  cancel(id: string): void {
    const handle = this.timers.get(id);
    if (handle) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
  }

  cancelAll(): void {
    for (const handle of this.timers.values()) clearTimeout(handle);
    this.timers.clear();
  }
}
