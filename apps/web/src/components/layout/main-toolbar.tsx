import { AccountMenu } from "@/components/layout/account-menu";
import { MainToolbarBrandLink } from "@/components/layout/main-toolbar-brand-link";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { Search } from "@/components/layout/search";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@curolia/ui/button";
import { MainToolbar as MainToolbarLayout } from "@curolia/ui/main-toolbar";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

function WhatsNewToolbarButton() {
  return (
    <Button
      variant="accent"
      rounded
      size="default"
      render={<Link to="/whats-new" />}
    >
      <Sparkles />
      What&apos;s new
    </Button>
  );
}

function ToolbarAccountMenu() {
  const { user } = useAuth();

  return user ? (
    <AccountMenu />
  ) : (
    <Button size="sm" render={<Link to="/login" />}>
      Sign in
    </Button>
  );
}

export function MainToolbar() {
  const { user } = useAuth();

  return (
    <MainToolbarLayout
      brand={<MainToolbarBrandLink />}
      rightPromo={user ? <WhatsNewToolbarButton /> : null}
      search={user ? <Search /> : null}
      accountMenu={<ToolbarAccountMenu />}
      notifications={user ? <NotificationsMenu /> : null}
    />
  );
}
