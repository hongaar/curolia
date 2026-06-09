import * as React from "react";

import { Input } from "./input";
import styles from "./prefixed-input.module.css";

type PrefixedInputProps = React.ComponentProps<typeof Input> & {
  prefix: string;
};

function PrefixedInput({ prefix, className, ...props }: PrefixedInputProps) {
  return (
    <div className={styles.group}>
      <span className={styles.prefix} aria-hidden="true">
        {prefix}
      </span>
      <Input className={className} {...props} />
    </div>
  );
}

export { PrefixedInput };
