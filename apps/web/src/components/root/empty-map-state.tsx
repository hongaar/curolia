import { useNavigationShell } from "@/providers/navigation-shell-provider";
import { Button } from "@curolia/ui/button";
import { MapHost, MapLayer, MapPageRoot, MapVignette } from "@curolia/ui/map";
import { MapPlus } from "lucide-react";

/** Shown when a signed-in user has no maps yet. */
export function EmptyMapState() {
  const { openNewMapDialog } = useNavigationShell();

  return (
    <MapPageRoot>
      <MapLayer>
        <MapVignette />
        <MapHost>
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(160deg, color-mix(in oklch, var(--muted) 40%, transparent), color-mix(in oklch, var(--background) 90%, transparent))",
            }}
          />
        </MapHost>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "var(--space-6)",
            pointerEvents: "none",
            zIndex: 9,
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              maxWidth: "24rem",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: "var(--space-4)",
              padding: "var(--space-6)",
              borderRadius: "var(--radius-lg)",
              background: "var(--panel-bg-solid)",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "var(--text-xl)",
                fontWeight: 600,
              }}
            >
              Create your first map
            </h1>
            <p
              style={{
                margin: 0,
                color: "var(--muted-foreground)",
                lineHeight: 1.5,
              }}
            >
              Pin places, share routes, and build a map that&apos;s yours.
            </p>
            <Button onClick={() => openNewMapDialog()}>
              <MapPlus aria-hidden />
              New map
            </Button>
          </div>
        </div>
      </MapLayer>
    </MapPageRoot>
  );
}
