import { describe, expect, it } from "vitest";
import {
  extractUrlFromSharedText,
  fileFromClipboardData,
  isPinFormTextEntryPasteTarget,
  urlFromClipboardText,
} from "./pin-form-clipboard";

function mockDataTransfer(init: {
  files?: File[];
  text?: string;
}): DataTransfer {
  const files = init.files ?? [];
  const fileList = Object.assign([...files], {
    item: (index: number) => files[index] ?? null,
  }) as FileList;

  return {
    files: fileList,
    items: files.map((file) => ({
      kind: "file" as const,
      type: file.type,
      getAsFile: () => file,
    })),
    getData: (type: string) => (type === "text/plain" ? (init.text ?? "") : ""),
  } as unknown as DataTransfer;
}

describe("isPinFormTextEntryPasteTarget", () => {
  it("is true for text-like inputs, textareas, and contenteditable", () => {
    document.body.innerHTML = `
      <input id="title" type="text" />
      <input id="date" type="date" />
      <input id="url" type="url" />
      <textarea id="notes"></textarea>
      <div id="md" contenteditable="true"><p>x</p></div>
      <input id="check" type="checkbox" />
    `;
    expect(
      isPinFormTextEntryPasteTarget(document.getElementById("title")),
    ).toBe(true);
    expect(isPinFormTextEntryPasteTarget(document.getElementById("date"))).toBe(
      true,
    );
    expect(isPinFormTextEntryPasteTarget(document.getElementById("url"))).toBe(
      true,
    );
    expect(
      isPinFormTextEntryPasteTarget(document.getElementById("notes")),
    ).toBe(true);
    expect(
      isPinFormTextEntryPasteTarget(document.querySelector("#md p") as Element),
    ).toBe(true);
    expect(
      isPinFormTextEntryPasteTarget(document.getElementById("check")),
    ).toBe(false);
  });

  it("is false outside text entry controls", () => {
    document.body.innerHTML = `<div id="grid"><span id="label">Tags</span></div>`;
    expect(
      isPinFormTextEntryPasteTarget(document.getElementById("label")),
    ).toBe(false);
    expect(isPinFormTextEntryPasteTarget(null)).toBe(false);
  });
});

describe("fileFromClipboardData", () => {
  it("returns the first image file", () => {
    const image = new File(["x"], "shot.png", { type: "image/png" });
    const other = new File(["y"], "readme.txt", { type: "text/plain" });
    expect(
      fileFromClipboardData(mockDataTransfer({ files: [other, image] })),
    ).toBe(image);
  });

  it("returns null when there is no image", () => {
    const text = new File(["y"], "readme.txt", { type: "text/plain" });
    expect(
      fileFromClipboardData(mockDataTransfer({ files: [text] })),
    ).toBeNull();
    expect(fileFromClipboardData(mockDataTransfer({}))).toBeNull();
  });
});

describe("urlFromClipboardText", () => {
  it("normalizes a lone URL", () => {
    expect(urlFromClipboardText("example.com/page")).toBe(
      "https://example.com/page",
    );
    expect(urlFromClipboardText("  https://a.co/x  ")).toBe("https://a.co/x");
  });

  it("rejects prose, multiline, and invalid URLs", () => {
    expect(urlFromClipboardText("see https://example.com for info")).toBeNull();
    expect(urlFromClipboardText("not a url")).toBeNull();
    expect(urlFromClipboardText("https://a.co\nmore")).toBeNull();
  });
});

describe("extractUrlFromSharedText", () => {
  it("accepts a lone URL", () => {
    expect(extractUrlFromSharedText("https://maps.app.goo.gl/abc123")).toBe(
      "https://maps.app.goo.gl/abc123",
    );
  });

  it("extracts a URL embedded in share text", () => {
    expect(
      extractUrlFromSharedText(
        "Check out this place https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,17z",
      ),
    ).toBe(
      "https://www.google.com/maps/place/Eiffel+Tower/@48.8584,2.2945,17z",
    );
  });
});
