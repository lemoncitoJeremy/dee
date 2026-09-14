import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("wanna know dee", () => {
  it("starts with the personal landing panel", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /wanna know dee/i }),
    ).toBeVisible();
    expect(
      screen.getByText("A little app for getting to know Dee."),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /start/i })).toBeVisible();
  });
});
