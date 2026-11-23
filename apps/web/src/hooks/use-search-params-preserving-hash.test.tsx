import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";

import {
  locationWithPreservedHash,
  useSearchParamsPreservingHash,
} from "./use-search-params-preserving-hash";

describe("locationWithPreservedHash", () => {
  it("keeps the pin hash when writing camera search params", () => {
    const params = new URLSearchParams("lat=1&lng=2&zoom=10");
    expect(
      locationWithPreservedHash("/joram/trip/blog", params, "#e2e-target-pin"),
    ).toEqual({
      pathname: "/joram/trip/blog",
      search: "?lat=1&lng=2&zoom=10",
      hash: "#e2e-target-pin",
    });
  });

  it("omits search when params are empty", () => {
    expect(
      locationWithPreservedHash(
        "/joram/trip/gallery",
        new URLSearchParams(),
        "",
      ),
    ).toEqual({
      pathname: "/joram/trip/gallery",
      search: "",
      hash: "",
    });
  });
});

function CameraIdleProbe() {
  const [, setSearchParams] = useSearchParamsPreservingHash();
  const location = useLocation();
  return (
    <div>
      <span data-testid="hash">{location.hash}</span>
      <span data-testid="search">{location.search}</span>
      <button
        type="button"
        onClick={() =>
          setSearchParams(
            (prev) => {
              const next = new URLSearchParams(prev);
              next.set("lat", "1");
              return next;
            },
            { replace: true },
          )
        }
      >
        sync camera
      </button>
    </div>
  );
}

describe("useSearchParamsPreservingHash", () => {
  it("keeps the fragment when search params change", () => {
    render(
      <MemoryRouter
        initialEntries={["/joram/trip/blog?zoom=10#e2e-target-pin"]}
      >
        <Routes>
          <Route path="/joram/trip/blog" element={<CameraIdleProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("hash")).toHaveTextContent("#e2e-target-pin");
    fireEvent.click(screen.getByRole("button", { name: "sync camera" }));
    expect(screen.getByTestId("hash")).toHaveTextContent("#e2e-target-pin");
    expect(screen.getByTestId("search")).toHaveTextContent("lat=1");
  });
});
