import { mapViewHref, mapViewSegmentFromPathname } from "@/lib/app-paths";
import { mapRouteForMap } from "@/lib/map-route";
import { useMap } from "@/providers/map-provider";
import { Button } from "@curolia/ui/button";
import { PageInlineActions } from "@curolia/ui/page";
import { Stack } from "@curolia/ui/stack";
import { StatusCenterActionPanel } from "@curolia/ui/status-center";
import { Text } from "@curolia/ui/text";
import { Link, useLocation } from "react-router-dom";

export function MapSlugAccessBlocked() {
  const { publicView, memberMaps } = useMap();
  const location = useLocation();
  const next = encodeURIComponent(`${location.pathname}${location.search}`);
  const segment = mapViewSegmentFromPathname(location.pathname);
  const fallbackMap = memberMaps[0] ?? null;
  const fallbackHref =
    fallbackMap?.owner_profile_slug && fallbackMap.slug
      ? mapViewHref(segment, mapRouteForMap(fallbackMap))
      : "/";

  return (
    <StatusCenterActionPanel>
      <Stack gap="md" align="center">
        <Text variant={["muted", "center"]}>
          {publicView
            ? "This map is private or does not exist. Sign in if you were invited to view it."
            : "You don't have access to this map. Ask the owner for an invite."}
        </Text>
        <PageInlineActions spaced="none">
          {publicView ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link to={`/login?next=${next}`} />}
            >
              Sign in
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              render={<Link to={fallbackHref} />}
            >
              {fallbackMap?.slug ? "Back to my maps" : "Go home"}
            </Button>
          )}
        </PageInlineActions>
      </Stack>
    </StatusCenterActionPanel>
  );
}
