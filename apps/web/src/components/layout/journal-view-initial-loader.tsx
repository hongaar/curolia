import {
  StatusCenterLoader,
  StatusCenterPanel,
} from "@curolia/ui/status-center";

type JournalViewInitialLoaderProps = {
  label?: string;
  busy?: boolean;
};

export function JournalViewInitialLoader({
  label = "Loading…",
  busy = true,
}: JournalViewInitialLoaderProps) {
  if (busy) {
    return (
      <StatusCenterLoader
        minHeight
        label={label.endsWith("…") ? `${label.slice(0, -1)}` : label}
      />
    );
  }

  return <StatusCenterPanel>{label}</StatusCenterPanel>;
}
