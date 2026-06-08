import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchCombobox } from "./search-combobox";

describe("SearchCombobox", () => {
  it("renders without crashing", () => {
    render(
      <SearchCombobox
        query=""
        onQueryChange={() => {}}
        groups={[]}
        getItemKey={(o) => o}
        onSelect={() => {}}
        renderItem={(o) => ({ title: o })}
        placeholder="Search"
      />,
    );
    expect(document.body).toBeTruthy();
  });
});
