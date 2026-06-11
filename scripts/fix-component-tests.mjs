#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const FIXES = {
  "app-shell": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppShellLayout } from "./app-shell";

describe("AppShellLayout", () => {
  it("renders without crashing", () => {
    render(<AppShellLayout toolbar={<div>Toolbar</div>}><div>Content</div></AppShellLayout>);
    expect(document.body).toBeTruthy();
  });
});
`,
  blog: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlogPageRoot } from "./blog";

describe("BlogPageRoot", () => {
  it("renders without crashing", () => {
    render(<BlogPageRoot><div>Blog</div></BlogPageRoot>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "choice-cards": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChoiceCard } from "./choice-cards";

describe("ChoiceCard", () => {
  it("renders without crashing", () => {
    render(<ChoiceCard value="a" selected={false} onSelect={() => {}}>Option A</ChoiceCard>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "emoji-picker": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmojiFieldPicker } from "./picker";

describe("EmojiFieldPicker", () => {
  it("renders without crashing", () => {
    render(<EmojiFieldPicker value="📍" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  fab: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FabButton } from "./fab";

describe("FabButton", () => {
  it("renders without crashing", () => {
    render(<FabButton aria-label="Add" onClick={() => {}}>+</FabButton>);
    expect(document.body).toBeTruthy();
  });
});
`,
  search: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchIcon } from "./search";

describe("SearchIcon", () => {
  it("renders without crashing", () => {
    render(<SearchIcon><span>S</span></SearchIcon>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "floating-nav-bar": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AccountMenuTrigger } from "./floating-nav-bar";

describe("AccountMenuTrigger", () => {
  it("renders without crashing", () => {
    render(<AccountMenuTrigger>Menu</AccountMenuTrigger>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "loading-splash": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CuroliaLoadingSplash } from "./loading-splash";

describe("CuroliaLoadingSplash", () => {
  it("renders without crashing", () => {
    render(<CuroliaLoadingSplash />);
    expect(document.body).toBeTruthy();
  });
});
`,
  list: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BorderedList } from "./list";

describe("BorderedList", () => {
  it("renders without crashing", () => {
    render(<BorderedList><li>Item</li></BorderedList>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-metadata-subtitle": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinMetadataSubtitleContent } from "./pin-metadata-subtitle";

describe("PinMetadataSubtitleContent", () => {
  it("renders without crashing", () => {
    render(<PinMetadataSubtitleContent subtitle={{ parts: [{ kind: "text", text: "Open" }] }} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "main-toolbar": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MainToolbar } from "./main-toolbar";

describe("MainToolbar", () => {
  it("renders without crashing", () => {
    render(<MainToolbar left={<span>Left</span>} right={<span>Right</span>} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "map-picker": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MapPickerTrigger } from "./map-picker";

describe("MapPickerTrigger", () => {
  it("renders without crashing", () => {
    render(<MapPickerTrigger mapName="My map" emoji="📍" />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "notifications-popover": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NotificationsIconTrigger } from "./notifications-popover";

describe("NotificationsIconTrigger", () => {
  it("renders without crashing", () => {
    render(<NotificationsIconTrigger count={0} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "markdown-editor": `import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MarkdownEditor } from "./markdown-editor";

vi.mock("@mdxeditor/editor", () => ({
  MDXEditor: () => <div>Editor</div>,
  headingsPlugin: () => ({}),
  listsPlugin: () => ({}),
  quotePlugin: () => ({}),
  thematicBreakPlugin: () => ({}),
  markdownShortcutPlugin: () => ({}),
  linkPlugin: () => ({}),
  linkDialogPlugin: () => ({}),
  toolbarPlugin: () => ({}),
  UndoRedo: () => null,
  BoldItalicUnderlineToggles: () => null,
  ListsToggle: () => null,
  BlockTypeSelect: () => null,
  CreateLink: () => null,
}));

describe("MarkdownEditor", () => {
  it("renders without crashing", () => {
    render(<MarkdownEditor value="" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  onboarding: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingTitle } from "./onboarding";

describe("OnboardingTitle", () => {
  it("renders without crashing", () => {
    render(<OnboardingTitle>Welcome</OnboardingTitle>);
    expect(document.body).toBeTruthy();
  });
});
`,
  page: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Page, PageTitle } from "./page";

describe("Page", () => {
  it("renders without crashing", () => {
    render(<Page><PageTitle>Test</PageTitle></Page>);
    expect(document.body).toBeTruthy();
  });
});
`,
  picker: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PresetColorPicker } from "./picker";

describe("PresetColorPicker", () => {
  it("renders without crashing", () => {
    render(<PresetColorPicker value="#ff0000" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-detail": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinDetailCard, PinDetailTitle } from "./pin-detail";

describe("PinDetailCard", () => {
  it("renders without crashing", () => {
    render(<PinDetailCard><PinDetailTitle>Pin</PinDetailTitle></PinDetailCard>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-links": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinLinksListRoot } from "./pin-links";

describe("PinLinksListRoot", () => {
  it("renders without crashing", () => {
    render(<PinLinksListRoot><div>Links</div></PinLinksListRoot>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-form": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinFormPanelFieldGroup } from "./pin-form";

describe("PinFormPanelFieldGroup", () => {
  it("renders without crashing", () => {
    render(<PinFormPanelFieldGroup><div>Field</div></PinFormPanelFieldGroup>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-photo-lightbox": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPhotoThumb } from "./pin-photo-lightbox";

describe("PinPhotoThumb", () => {
  it("renders without crashing", () => {
    render(<PinPhotoThumb src="https://example.com/photo.jpg" alt="Photo" />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-photo-gallery": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPhotoGallery } from "./pin-photo-gallery";

describe("PinPhotoGallery", () => {
  it("renders without crashing", () => {
    render(<PinPhotoGallery photos={[]} onPhotoClick={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
`,
  "pin-place-metadata": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PinPlaceMetadataRoot } from "./pin-place-metadata";

describe("PinPlaceMetadataRoot", () => {
  it("renders without crashing", () => {
    render(<PinPlaceMetadataRoot><div>Metadata</div></PinPlaceMetadataRoot>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "plugin-account": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginAccountPanel } from "./plugin-account";

describe("PluginAccountPanel", () => {
  it("renders without crashing", () => {
    render(<PluginAccountPanel><div>Account</div></PluginAccountPanel>);
    expect(document.body).toBeTruthy();
  });
});
`,
  plugins: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginListRow } from "./plugins";

describe("PluginListRow", () => {
  it("renders without crashing", () => {
    render(<PluginListRow><div>Plugin</div></PluginListRow>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "plugin-panel": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PluginSection } from "./plugin-panel";

describe("PluginSection", () => {
  it("renders without crashing", () => {
    render(<PluginSection><div>Section</div></PluginSection>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "search-combobox": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchCombobox } from "./search-combobox";

describe("SearchCombobox", () => {
  it("renders without crashing", () => {
    render(
      <SearchCombobox
        value=""
        onChange={() => {}}
        options={[]}
        getOptionLabel={(o) => o}
        getOptionValue={(o) => o}
        placeholder="Search"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
`,
  "status-center": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusCenterMessage } from "./status-center";

describe("StatusCenterMessage", () => {
  it("renders without crashing", () => {
    render(<StatusCenterMessage>Loading</StatusCenterMessage>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "suggestion-card": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SuggestionCard } from "./suggestion-card";

describe("SuggestionCard", () => {
  it("renders without crashing", () => {
    render(<SuggestionCard title="Suggestion" description="Desc" />);
    expect(document.body).toBeTruthy();
  });
});
`,
  tooltip: `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tooltip, TooltipContent, TooltipTitle } from "./tooltip";

describe("Tooltip", () => {
  it("renders without crashing", () => {
    render(<Tooltip><TooltipContent><TooltipTitle>Tip</TooltipTitle></TooltipContent></Tooltip>);
    expect(document.body).toBeTruthy();
  });
});
`,
  "wizard-steps": `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WizardSteps } from "./wizard-steps";

describe("WizardSteps", () => {
  it("renders without crashing", () => {
    render(<WizardSteps steps={[{ id: "1", label: "Step 1" }]} currentStep={0} aria-label="Steps" />);
    expect(document.body).toBeTruthy();
  });
});
`,
};

for (const [slug, content] of Object.entries(FIXES)) {
  const path = join("packages/ui/src/components", slug, `${slug}.test.tsx`);
  writeFileSync(path, content);
  console.log("Fixed:", path);
}

// Fix emoji-picker path - it should use emoji-picker not picker
writeFileSync(
  "packages/ui/src/components/emoji-picker/emoji-picker.test.tsx",
  `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmojiFieldPicker } from "../picker/picker";

describe("EmojiFieldPicker", () => {
  it("renders without crashing", () => {
    render(<EmojiFieldPicker value="📍" onChange={() => {}} />);
    expect(document.body).toBeTruthy();
  });
});
`,
);

console.log("Done.");
