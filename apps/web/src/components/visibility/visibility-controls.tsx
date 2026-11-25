import type { VisibilityScheme } from "@/lib/visibility-schemes";
import { Button } from "@curolia/ui/button";
import { ChoiceCard, ChoiceCards } from "@curolia/ui/choice-cards";
import { InfoTip } from "@curolia/ui/info-tip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

type IconComponent = VisibilityScheme<string>["icons"][string];

export function VisibilityMenu<T extends string>({
  scheme,
  value,
  onValueChange,
  disabled = false,
  ariaLabel,
}: {
  scheme: VisibilityScheme<T>;
  value: T;
  onValueChange: (next: T) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const Icon: IconComponent = scheme.icons[value];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel}
          />
        }
      >
        <Icon aria-hidden size={16} />
        {scheme.labels[value]}
        <ChevronDown aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              const match = scheme.options.find((option) => option === next);
              if (match && match !== value) onValueChange(match);
            }}
          >
            {scheme.options.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {scheme.labels[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VisibilityChoiceCards<T extends string>({
  scheme,
  name,
  value,
  hints,
  details,
  footers,
  onValueChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
}: {
  scheme: VisibilityScheme<T>;
  name: string;
  value: T;
  hints: Record<T, string>;
  /** Optional longer explanation per option, behind a "Learn more" tip. */
  details?: Partial<Record<T, string>>;
  /** Extra controls inside an option's card (clicks don't select it). */
  footers?: Partial<Record<T, ReactNode>>;
  onValueChange: (next: T) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  return (
    <ChoiceCards<T>
      name={name}
      value={value}
      disabled={disabled}
      aria-labelledby={ariaLabelledBy}
      onValueChange={(next) => {
        if (next !== value) onValueChange(next);
      }}
    >
      {scheme.options.map((option) => {
        const Icon: IconComponent = scheme.icons[option];
        return (
          <ChoiceCard<T>
            key={option}
            value={option}
            label={scheme.labels[option]}
            description={
              details?.[option] ? (
                <>
                  {hints[option]} <InfoTip>{details[option]}</InfoTip>
                </>
              ) : (
                hints[option]
              )
            }
            previewIcon={<Icon aria-hidden size={24} />}
            previewTone="muted"
            footer={footers?.[option]}
          />
        );
      })}
    </ChoiceCards>
  );
}
