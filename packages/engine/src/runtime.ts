import type { EventBus } from "@party/event-bus";
import type { PlayerId } from "@party/contracts";
import type { GameRunner, RunResult } from "./runner";
import { NodeTimerScheduler, type TimerScheduler } from "./scheduler";

/**
 * The anti-corruption boundary between a game session and the rest of the platform. It drives a
 * {@link GameRunner}, publishes the envelopes the runner produces to the {@link EventBus}, and
 * schedules the timers it requests. Game modules and platform consumers never reference each
 * other — they only meet here, through versioned envelopes.
 */
export class EngineRuntime<S, Cfg, Actions extends Record<string, unknown>> {
  constructor(
    private readonly runner: GameRunner<S, Cfg, Actions>,
    private readonly bus: EventBus,
    private readonly scheduler: TimerScheduler = new NodeTimerScheduler(),
  ) {}

  async start(): Promise<void> {
    await this.flush(this.runner.start());
  }

  async dispatch<K extends keyof Actions>(
    player: PlayerId,
    action: K,
    payload: Actions[K],
  ): Promise<void> {
    await this.flush(this.runner.dispatch(player, action, payload));
  }

  view(player: PlayerId): unknown {
    return this.runner.view(player);
  }

  isFinished(): boolean {
    return this.runner.isFinished();
  }

  /** Stop all pending timers — call when the room closes. */
  dispose(): void {
    this.scheduler.cancelAll();
  }

  private async flush(result: RunResult): Promise<void> {
    // Publish in order so per-room `sequence` is observed monotonically by consumers.
    for (const envelope of result.envelopes) {
      await this.bus.publish(envelope);
    }
    for (const timer of result.timers) {
      if (timer.op === "set") {
        this.scheduler.set(timer.id, timer.delayMs, () => {
          void this.flush(this.runner.fireTimer(timer.id));
        });
      } else {
        this.scheduler.cancel(timer.id);
      }
    }
  }
}
