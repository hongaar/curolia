import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FileUploadInput, FileUploadLabel, FileUploadRow } from "./file-upload";

describe("file-upload", () => {
  it("renders without crashing", () => {
    render(
      <FileUploadRow>
        <FileUploadLabel input={<FileUploadInput type="file" />}>
          Upload
        </FileUploadLabel>
      </FileUploadRow>,
    );
    expect(document.body).toBeTruthy();
  });
});
