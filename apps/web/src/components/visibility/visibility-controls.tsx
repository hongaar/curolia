import {
  VISIBILITY_LABELS,
  VISIBILITY_OPTIONS,
  isVisibility,
  type Visibility,
} from "@/lib/visibility";
import { Button } from "@curolia/ui/button";
import { ChoiceCard, ChoiceCards } from "@curolia/ui/choice-cards";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { ChevronDown, Globe, Link, Lock } from "lucide-react";

const VISIBILITY_ICONS: Record<Visibility, typeof Globe> = {
  public: Globe,
  unlisted: Link,
  private: Lock,
};

export function VisibilityMenu({
  value,
  onValueChange,
  disabled = false,
  ariaLabel,
}: {
  value: Visibility;
  onValueChange: (next: Visibility) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  const Icon = VISIBILITY_ICONS[value];
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
        {VISIBILITY_LABELS[value]}
        <ChevronDown aria-hidden size={16} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(next) => {
              if (isVisibility(next) && next !== value) onValueChange(next);
            }}
          >
            {VISIBILITY_OPTIONS.map((option) => (
              <DropdownMenuRadioItem key={option} value={option}>
                {VISIBILITY_LABELS[option]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VisibilityChoiceCards({
  name,
  value,
  hints,
  onValueChange,
  disabled = false,
  "aria-labelledby": ariaLabelledBy,
}: {
  name: string;
  value: Visibility;
  hints: Record<Visibility, string>;
  onValueChange: (next: Visibility) => void;
  disabled?: boolean;
  "aria-labelledby"?: string;
}) {
  return (
    <ChoiceCards<Visibility>
      name={name}
      value={value}
      disabled={disabled}
      aria-labelledby={ariaLabelledBy}
      onValueChange={(next) => {
        if (next !== value) onValueChange(next);
      }}
    >
      {VISIBILITY_OPTIONS.map((option) => {
        const Icon = VISIBILITY_ICONS[option];
        return (
          <ChoiceCard<Visibility>
            key={option}
            value={option}
            label={VISIBILITY_LABELS[option]}
            description={hints[option]}
            previewIcon={<Icon aria-hidden size={24} />}
            previewTone="muted"
          />
        );
      })}
    </ChoiceCards>
  );
}
