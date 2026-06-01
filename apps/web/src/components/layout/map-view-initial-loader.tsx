import {
  StatusCenterLoader,
  StatusCenterPanel,
} from "@curolia/ui/status-center";

type MapViewInitialLoaderProps = {
  label?: string;
  busy?: boolean;
};

export function MapViewInitialLoader({
  label = "Loading…",
  busy = true,
}: MapViewInitialLoaderProps) {
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
