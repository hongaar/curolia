import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

import { cn } from "../../lib/utils";
import styles from "./tabs.module.css";

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(styles.root, className)}
      {...props}
    />
  );
}

type TabsListVariant = "default" | "line";

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & { variant?: TabsListVariant }) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        styles.list,
        variant === "line" ? styles.listVariantLine : styles.listVariantDefault,
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(styles.trigger, className)}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(styles.content, className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent, type TabsListVariant };
