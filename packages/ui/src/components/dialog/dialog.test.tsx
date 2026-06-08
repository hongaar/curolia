import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogBody,
  DialogCardTitle,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./dialog";

describe("dialog", () => {
  it("renders without crashing", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>,
    );
    expect(document.body).toBeTruthy();
  });

  it("renders scrollable body", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Title</DialogTitle>
          </DialogHeader>
          <DialogBody>Body</DialogBody>
        </DialogContent>
      </Dialog>,
    );
    expect(document.querySelector('[data-slot="dialog-body"]')).toBeTruthy();
  });

  it("renders embedded shell without modal chrome", () => {
    render(
      <DialogContent modal={false}>
        <DialogHeader>
          <DialogCardTitle>Title</DialogCardTitle>
        </DialogHeader>
      </DialogContent>,
    );
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toBeNull();
    expect(document.querySelector('[data-slot="dialog-content"]')).toBeTruthy();
  });
});
