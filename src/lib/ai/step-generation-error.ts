export type StepGenerationErrorCode = "insufficient_detail" | "too_many_steps_requested";

export class StepGenerationError extends Error {
  readonly code: StepGenerationErrorCode;
  readonly naturalStepCount: number;
  readonly requestedStepCount: number;

  constructor(params: {
    code: StepGenerationErrorCode;
    naturalStepCount: number;
    requestedStepCount: number;
  }) {
    super(params.code);
    this.name = "StepGenerationError";
    this.code = params.code;
    this.naturalStepCount = params.naturalStepCount;
    this.requestedStepCount = params.requestedStepCount;
  }
}

export function isStepGenerationError(error: unknown): error is StepGenerationError {
  return error instanceof StepGenerationError;
}
