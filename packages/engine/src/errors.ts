/** Thrown when an action fails validation/authorization. Safe to surface the message to clients. */
export class ActionRejected extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "ActionRejected";
  }
}

/** Thrown for misuse of the runner (e.g. acting on a finished or unstarted game). */
export class EngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EngineError";
  }
}
