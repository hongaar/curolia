import { Circle, CircleCheck, CircleX, Loader2 } from "lucide-react";

import { cn } from "../../lib/utils";
import styles from "./task-progress.module.css";

export type TaskProgressStatus =
  | "unstarted"
  | "running"
  | "completed"
  | "failed";

export type TaskProgressStep = {
  id: string;
  label: string;
  state: "pending" | "current" | "done";
};

export function TaskProgress({
  title,
  phase,
  detail,
  progress,
  steps,
  status = "running",
}: {
  title: string;
  phase: string;
  detail?: string;
  /** 0–100 for determinate progress while `status` is `running`; ignored otherwise. */
  progress?: number;
  steps?: readonly TaskProgressStep[];
  status?: TaskProgressStatus;
}) {
  const isRunning = status === "running";
  const clampedRunning =
    progress === undefined
      ? undefined
      : Math.min(100, Math.max(0, Math.round(progress)));

  const barWidth =
    status === "completed"
      ? 100
      : status === "unstarted"
        ? 0
        : status === "failed"
          ? (clampedRunning ?? 0)
          : clampedRunning;

  const barIndeterminate = isRunning && clampedRunning === undefined;

  return (
    <div
      className={cn(
        styles.root,
        status === "unstarted" && styles.rootUnstarted,
        status === "completed" && styles.rootCompleted,
        status === "failed" && styles.rootFailed,
      )}
      role="status"
      aria-live="polite"
      aria-busy={isRunning}
    >
      <div className={styles.header}>
        <TaskProgressStatusIcon status={status} />
        <div className={styles.headerBody}>
          <p className={styles.title}>{title}</p>
          <p
            className={cn(
              styles.phase,
              status === "completed" && styles.phaseCompleted,
              status === "failed" && styles.phaseFailed,
            )}
          >
            {phase}
          </p>
          {detail ? <p className={styles.detail}>{detail}</p> : null}
        </div>
      </div>

      <div className={styles.track} aria-hidden>
        <div
          className={cn(
            styles.bar,
            barIndeterminate && styles.barIndeterminate,
            status === "completed" && styles.barCompleted,
            status === "failed" && styles.barFailed,
            status === "unstarted" && styles.barUnstarted,
          )}
          style={barIndeterminate ? undefined : { width: `${barWidth ?? 0}%` }}
        />
      </div>

      {steps && steps.length > 0 ? (
        <ol className={styles.steps}>
          {steps.map((step) => (
            <li
              key={step.id}
              className={cn(
                styles.step,
                step.state === "done" && styles.stepDone,
                step.state === "current" && styles.stepCurrent,
              )}
            >
              <span className={styles.stepMarker} aria-hidden />
              {step.label}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function TaskProgressStatusIcon({ status }: { status: TaskProgressStatus }) {
  switch (status) {
    case "unstarted":
      return (
        <Circle
          className={cn(styles.statusIcon, styles.statusIconUnstarted)}
          aria-hidden
        />
      );
    case "completed":
      return (
        <CircleCheck
          className={cn(styles.statusIcon, styles.statusIconCompleted)}
          aria-hidden
        />
      );
    case "failed":
      return (
        <CircleX
          className={cn(styles.statusIcon, styles.statusIconFailed)}
          aria-hidden
        />
      );
    default:
      return (
        <Loader2
          className={cn(styles.statusIcon, styles.statusIconRunning, "spin")}
          aria-hidden
        />
      );
  }
}
