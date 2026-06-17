import type {
  BlogPinListDirection,
  BlogPinListOrder,
} from "@/lib/blog-pin-list-order";
import {
  blogPinListDirectionAriaLabel,
  blogPinListDirectionLabel,
  blogPinListDirectionOptions,
  blogPinListOrderAriaLabel,
  blogPinListOrderLabel,
} from "@/lib/blog-pin-list-order";
import {
  BlogLead,
  BlogSortChevron,
  BlogSortLabel,
  BlogSortTrigger,
} from "@curolia/ui/blog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@curolia/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type BlogPinListSortLeadProps = {
  order: BlogPinListOrder;
  direction: BlogPinListDirection;
  onOrderChange: (order: BlogPinListOrder) => void;
  onDirectionChange: (direction: BlogPinListDirection) => void;
};

export function BlogPinListSortLead({
  order,
  direction,
  onOrderChange,
  onDirectionChange,
}: BlogPinListSortLeadProps) {
  return (
    <BlogLead>
      Pins are listed in{" "}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <BlogSortTrigger aria-label={blogPinListOrderAriaLabel(order)} />
          }
        >
          <BlogSortLabel>{blogPinListOrderLabel(order)}</BlogSortLabel>
          <BlogSortChevron>
            <ChevronDown aria-hidden />
          </BlogSortChevron>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={order}
              onValueChange={(v) => {
                if (
                  v === "chronological" ||
                  v === "alphabetical" ||
                  v === "created"
                ) {
                  onOrderChange(v);
                }
              }}
            >
              <DropdownMenuRadioItem value="chronological">
                Chronological
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="alphabetical">
                Alphabetical
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="created">
                Created
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>{" "}
      order,{" "}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <BlogSortTrigger
              aria-label={blogPinListDirectionAriaLabel(order, direction)}
            />
          }
        >
          <BlogSortLabel>
            {blogPinListDirectionLabel(order, direction)}
          </BlogSortLabel>
          <BlogSortChevron>
            <ChevronDown aria-hidden />
          </BlogSortChevron>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuRadioGroup
              value={direction}
              onValueChange={(v) => {
                if (v === "asc" || v === "desc") {
                  onDirectionChange(v);
                }
              }}
            >
              {blogPinListDirectionOptions(order).map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      .
    </BlogLead>
  );
}
