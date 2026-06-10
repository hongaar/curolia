import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";
import { useCallback, useLayoutEffect, useRef } from "react";

import { cn } from "../../lib/utils";
import styles from "./checkbox.module.css";

function anchorHiddenInputs(anchor: HTMLElement | null) {
  if (!anchor) return;
  for (const input of anchor.querySelectorAll<HTMLInputElement>("input")) {
    input.style.setProperty("position", "absolute", "important");
    input.style.setProperty("top", "0", "important");
    input.style.setProperty("left", "0", "important");
  }
}

function Checkbox({
  className,
  inputRef,
  ...props
}: CheckboxPrimitive.Root.Props) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  const fixHiddenInputPosition = useCallback(() => {
    anchorHiddenInputs(anchorRef.current);
  }, []);

  useLayoutEffect(() => {
    fixHiddenInputPosition();
  });

  const mergedInputRef = useCallback(
    (element: HTMLInputElement | null) => {
      if (element) fixHiddenInputPosition();
      if (typeof inputRef === "function") {
        inputRef(element);
      } else if (inputRef != null) {
        inputRef.current = element;
      }
    },
    [fixHiddenInputPosition, inputRef],
  );

  return (
    <span ref={anchorRef} className={styles.anchor} data-slot="checkbox-anchor">
      <CheckboxPrimitive.Root
        data-slot="checkbox"
        className={cn(styles.root, className)}
        inputRef={mergedInputRef}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className={styles.indicator}
        >
          <CheckIcon />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    </span>
  );
}

export { Checkbox };
