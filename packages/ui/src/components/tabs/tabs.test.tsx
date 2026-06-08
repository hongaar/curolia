import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

describe("tabs", () => {
  it("renders without crashing", () => {
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a">A</TabsTrigger>
        </TabsList>
        <TabsContent value="a">Content</TabsContent>
      </Tabs>,
    );
    expect(document.body).toBeTruthy();
  });
});
