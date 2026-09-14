import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("reveals the four activity cards after Start", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));

    expect(screen.getByRole("button", { name: /matcha girly/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /race week/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /^spicy/i })).toBeVisible();
    expect(
      screen.getByRole("button", { name: /japanese food/i }),
    ).toBeVisible();
  });

  it("adds, edits, and deletes a schedule from an activity", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await user.click(screen.getByRole("button", { name: /matcha girly/i }));
    await user.click(screen.getByRole("button", { name: /add schedule/i }));
    await user.clear(screen.getByLabelText(/^date$/i));
    await user.type(screen.getByLabelText(/^date$/i), "2026-09-17");
    await user.clear(screen.getByLabelText(/^time$/i));
    await user.type(screen.getByLabelText(/^time$/i), "18:00");
    await user.type(
      screen.getByLabelText(/^notes$/i),
      "Try that new matcha place",
    );
    await user.click(screen.getByRole("button", { name: /save schedule/i }));

    const schedule = await screen.findByRole("button", {
      name: /try that new matcha place/i,
    });
    await user.click(schedule);
    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.clear(screen.getByLabelText(/^notes$/i));
    await user.type(screen.getByLabelText(/^notes$/i), "Meet by the window");
    await user.click(screen.getByRole("button", { name: /save schedule/i }));
    expect(
      await screen.findByRole("button", { name: /meet by the window/i }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: /meet by the window/i }));
    await user.click(screen.getByRole("button", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /yes, delete/i }));
    expect(screen.queryByText("Meet by the window")).not.toBeInTheDocument();
  });

  it("switches weeks and opens the combined schedule tab", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await user.click(screen.getByRole("button", { name: /matcha girly/i }));
    expect(screen.getByText(/sep 14.*20, 2026/i)).toBeVisible();
    await user.click(screen.getByRole("button", { name: /next week/i }));
    expect(screen.getByText(/sep 21.*27, 2026/i)).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^schedule$/i }));
    expect(
      screen.getByRole("heading", { name: /all our little plans/i }),
    ).toBeVisible();
  });
});
