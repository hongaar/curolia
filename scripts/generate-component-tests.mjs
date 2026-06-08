#!/usr/bin/env node
/**
 * Generates smoke tests for @curolia/ui components.
 * Run from repo root: node scripts/generate-component-tests.mjs
 */
import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const COMPONENTS_DIR = "packages/ui/src/components";

const CUSTOM_RENDER = {
  field: `render(
      <Field id="test" label="Test field">
        <input id="test" />
      </Field>,
    );`,
  text: `render(<Text>Hello</Text>);`,
  button: `render(<Button>Click</Button>);`,
  input: `render(<Input placeholder="Test" />);`,
  label: `render(<Label htmlFor="x">Label</Label>);`,
  badge: `render(<Badge>Badge</Badge>);`,
  separator: `render(<Separator />);`,
  box: `render(<Box>Content</Box>);`,
  stack: `render(<Stack>Content</Stack>);`,
  card: `render(<Card><CardContent>Content</CardContent></Card>);`,
  list: `render(<List><ListItem>Item</ListItem></List>);`,
  tabs: `render(
      <Tabs defaultValue="a">
        <TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList>
        <TabsContent value="a">Content</TabsContent>
      </Tabs>,
    );`,
  checkbox: `render(<Checkbox />);`,
  switch: `render(<Switch />);`,
  textarea: `render(<Textarea placeholder="Test" />);`,
  tooltip: `render(<Tooltip><TooltipTrigger>Hover</TooltipTrigger><TooltipContent>Tip</TooltipContent></Tooltip>);`,
  sonner: `render(<Toaster />);`,
  "error-boundary": `render(<ErrorBoundary fallback={<div>Error</div>}><div>Child</div></ErrorBoundary>);`,
  "form-layout": `render(<FormSection><span>Section</span></FormSection>);`,
  "markdown-content": `render(<MarkdownContent markdown="Hello **world**" />);`,
  "pin-metadata-subtitle": `render(<PinMetadataSubtitleView subtitle={{ parts: [{ kind: "text", text: "Open" }] }} />);`,
  "dropdown-menu-list": `render(<DropdownMenuEditRow><span>Item</span></DropdownMenuEditRow>);`,
  dialog: `render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>Title</DialogTitle></DialogHeader>
        </DialogContent>
      </Dialog>,
    );`,
  sheet: `render(
      <Sheet open>
        <SheetContent><SheetHeader><SheetTitle>Title</SheetTitle></SheetHeader></SheetContent>
      </Sheet>,
    );`,
  popover: `render(
      <Popover open>
        <PopoverTrigger render={<Button>Open</Button>} />
        <PopoverContent>Content</PopoverContent>
      </Popover>,
    );`,
  select: `render(
      <Select defaultValue="a">
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="a">A</SelectItem>
        </SelectContent>
      </Select>,
    );`,
  "floating-nav-bar": `render(
      <MemoryRouter>
        <FloatingNavBar items={[{ to: "/", label: "Home", icon: <span>H</span> }]} />
      </MemoryRouter>,
    );`,
  "page-back-button": `render(
      <MemoryRouter>
        <PageBackButton to="/" />
      </MemoryRouter>,
    );`,
  "segmented-switcher": `render(
      <MemoryRouter initialEntries={["/"]}>
        <SegmentedSwitcher items={[{ to: "/", label: "Map", icon: <span>M</span> }]} />
      </MemoryRouter>,
    );`,
  "global-search": `render(<GlobalSearchTrigger placeholder="Search" onOpenChange={() => {}} />);`,
  map: `render(<MapPageRoot><div>Map</div></MapPageRoot>);`,
  "pin-detail": `render(<PinDetailRoot><div>Detail</div></PinDetailRoot>);`,
  "pin-form": `render(<PinFormSection><div>Form</div></PinFormSection>);`,
  "login-layout": `render(<LoginLayout title="Sign in"><div>Form</div></LoginLayout>);`,
  page: `render(<Page><PageHeader title="Test" /></Page>);`,
  blog: `render(<BlogLayout title="Blog"><div>Posts</div></BlogLayout>);`,
  fab: `render(<Fab aria-label="Add" onClick={() => {}}><span>+</span></Fab>);`,
  "loading-splash": `render(<LoadingSplash />);`,
  onboarding: `render(<OnboardingStep title="Welcome" description="Get started" />);`,
  plugins: `render(<PluginsPageLayout title="Plugins"><div>List</div></PluginsPageLayout>);`,
  "plugin-account": `render(<PluginAccountCard name="Plugin" description="Desc" />);`,
  "plugin-panel": `render(<PluginPanel title="Panel"><div>Content</div></PluginPanel>);`,
  "plugin-pin": `render(<PluginPinCard title="Pin" />);`,
  "plugin-icon-frame": `render(<PluginIconFrame><span>P</span></PluginIconFrame>);`,
  "pin-links": `render(<PinLinksList links={[]} />);`,
  "pin-metadata-footer": `render(<PinMetadataFooter createdAt="2024-01-01" />);`,
  "pin-photo-gallery": `render(<PinPhotoGallery photos={[]} />);`,
  "pin-photo-lightbox": `render(<PinPhotoLightbox open={false} onOpenChange={() => {}} photos={[]} index={0} />);`,
  "user-avatar": `render(<UserAvatar name="Test User" />);`,
  "status-center": `render(<StatusCenter items={[]} />);`,
  "suggestion-card": `render(<SuggestionCard title="Suggestion" description="Desc" onAccept={() => {}} onDismiss={() => {}} />);`,
  "notifications-popover": `render(<NotificationsPopoverTrigger count={0} />);`,
  "entity-label-input": `render(<EntityLabelInput value={[]} onChange={() => {}} placeholder="Tags" />);`,
  "color-picker": `render(<ColorPicker value="#ff0000" onChange={() => {}} />);`,
  "emoji-picker": `render(<EmojiPickerButton value="📍" onChange={() => {}} />);`,
  picker: `render(<PickerTrigger>Open</PickerTrigger>);`,
  "search-combobox": `render(<SearchCombobox value="" onChange={() => {}} options={[]} placeholder="Search" />);`,
  "markdown-editor": `render(<MarkdownEditor value="" onChange={() => {}} />);`,
  "map-picker": `render(<MapPickerTrigger mapName="My map" emoji="📍" />);`,
  "main-toolbar": `render(<MainToolbar left={<span>Left</span>} right={<span>Right</span>} />);`,
  "app-shell": `render(<AppShell toolbar={<div>Toolbar</div>}><div>Content</div></AppShell>);`,
  "floating-panel": `render(<FloatingPanel><div>Panel</div></FloatingPanel>);`,
  "caution-panel": `render(<CautionPanel title="Caution">Message</CautionPanel>);`,
  "choice-cards": `render(<ChoiceCards options={[{ value: "a", label: "A" }]} value="a" onChange={() => {}} />);`,
  "wizard-steps": `render(<WizardSteps steps={[{ label: "Step 1" }]} currentStep={0} />);`,
  "task-progress": `render(<TaskProgress tasks={[]} />);`,
  "pin-place-metadata": `render(<PinPlaceMetadataList items={[]} />);`,
  "map-marker": `render(<MapMarker emoji="📍" />);`,
  "map-marker-popover": `render(<MapMarkerPopoverContent title="Pin" />);`,
  "map-floating": `render(<MapFloatingPanel><div>Floating</div></MapFloatingPanel>);`,
  "map-toolbar": `render(<MapToolbar><MapToolbarButton aria-label="Zoom" /></MapToolbar>);`,
  dropdown: null,
};

const CUSTOM_IMPORTS = {
  card: `import { Card, CardContent } from "./card";`,
  list: `import { List, ListItem } from "./list";`,
  tabs: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";`,
  tooltip: `import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";`,
  sonner: `import { Toaster } from "./sonner";`,
  "error-boundary": `import { ErrorBoundary } from "./error-boundary";`,
  "form-layout": `import { FormSection } from "./form-layout";`,
  "markdown-content": `import { MarkdownContent } from "./markdown-content";`,
  "pin-metadata-subtitle": `import { PinMetadataSubtitleView } from "./pin-metadata-subtitle";`,
  "dropdown-menu-list": `import { DropdownMenuEditRow } from "./dropdown-menu-list";`,
  dialog: `import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle } from "./dialog";`,
  sheet: `import { Sheet, SheetContent, SheetHeader, SheetTitle } from "./sheet";`,
  popover: `import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "../button";`,
  select: `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./select";`,
  "floating-nav-bar": `import { MemoryRouter } from "react-router-dom";
import { FloatingNavBar } from "./floating-nav-bar";`,
  "page-back-button": `import { MemoryRouter } from "react-router-dom";
import { PageBackButton } from "./page-back-button";`,
  "segmented-switcher": `import { MemoryRouter } from "react-router-dom";
import { SegmentedSwitcher } from "./segmented-switcher";`,
};

function walk(dir, results = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push({ slug: entry, dir: full });
  }
  return results;
}

function getPrimaryExport(slug, dir) {
  const tsxFiles = readdirSync(dir).filter(
    (f) =>
      f.endsWith(".tsx") && !f.includes(".stories.") && !f.includes(".test."),
  );
  for (const file of tsxFiles) {
    const content = readFileSync(join(dir, file), "utf8");
    const fn = content.match(/export function ([A-Z]\w+)/);
    if (fn) return { name: fn[1], file: file.replace(".tsx", "") };
    const constExport = content.match(/export const ([A-Z]\w+)/);
    if (constExport)
      return { name: constExport[1], file: file.replace(".tsx", "") };
  }
  return null;
}

let generated = 0;
for (const { slug, dir } of walk(COMPONENTS_DIR)) {
  const testPath = join(dir, `${slug}.test.tsx`);
  if (existsSync(testPath)) continue;

  const renderBody = CUSTOM_RENDER[slug];
  if (renderBody === null) continue;

  let importLine;
  if (CUSTOM_IMPORTS[slug]) {
    importLine = CUSTOM_IMPORTS[slug];
  } else if (renderBody) {
    const exp = getPrimaryExport(slug, dir);
    const file = exp?.file ?? slug;
    const name =
      exp?.name ??
      slug
        .split("-")
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join("");
    importLine = `import { ${name} } from "./${file}";`;
  } else {
    const exp = getPrimaryExport(slug, dir);
    if (!exp) {
      console.log("Skip:", slug);
      continue;
    }
    importLine = `import { ${exp.name} } from "./${exp.file}";`;
    CUSTOM_RENDER[slug] = `render(<${exp.name} />);`;
  }

  const testContent = `import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
${importLine}

describe("${slug}", () => {
  it("renders without crashing", () => {
    ${CUSTOM_RENDER[slug]}
    expect(document.body).toBeTruthy();
  });
});
`;

  writeFileSync(testPath, testContent);
  generated++;
  console.log("Generated:", testPath);
}

console.log(`\nDone. ${generated} test files generated.`);
