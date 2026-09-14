import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";
import { dateKey, formatWeekRange, shiftWeek, startOfWeek, weekDays } from "@/lib/calendar";

const thisMonday = startOfWeek(new Date());
const thisThursday = dateKey(weekDays(thisMonday)[3]);

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
    await user.type(screen.getByLabelText(/^date$/i), thisThursday);
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
    expect(screen.getByText(formatWeekRange(thisMonday))).toBeVisible();
    await user.click(screen.getByRole("button", { name: /next week/i }));
    expect(screen.getByText(formatWeekRange(shiftWeek(thisMonday, 1)))).toBeVisible();

    await user.click(screen.getByRole("button", { name: /^schedule$/i }));
    expect(
      screen.getByRole("heading", { name: /all our little plans/i }),
    ).toBeVisible();
  });

  it("shows early-morning schedules in the combined calendar", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await user.click(screen.getByRole("button", { name: /matcha girly/i }));
    await user.click(screen.getByRole("button", { name: /add schedule/i }));
    await user.clear(screen.getByLabelText(/^date$/i));
    await user.type(screen.getByLabelText(/^date$/i), thisThursday);
    await user.clear(screen.getByLabelText(/^time$/i));
    await user.type(screen.getByLabelText(/^time$/i), "05:30");
    await user.click(screen.getByRole("button", { name: /save schedule/i }));
    await user.click(screen.getByRole("button", { name: /^schedule$/i }));

    expect(await screen.findAllByRole("button", { name: /matcha girly 5:30 am/i })).not.toHaveLength(0);
    expect(screen.getByText("05:00")).toBeVisible();
  });

  it("saves Dee's answers and turns them into little facts", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await user.click(screen.getByRole("button", { name: /dee's world/i }));
    expect(
      screen.getByRole("heading", { name: /dee's world/i }),
    ).toBeVisible();

    await user.type(
      screen.getByRole("textbox", { name: /favorite drink/i }),
      "matcha",
    );
    await user.click(
      screen.getByRole("button", { name: /save favorite drink/i }),
    );
    expect(await screen.findByText(/favorite drink is matcha/i)).toBeVisible();

    await user.type(
      screen.getByRole("textbox", { name: /favorite food/i }),
      "ramen",
    );
    await user.click(
      screen.getByRole("button", { name: /save favorite food/i }),
    );
    await user.click(screen.getByRole("button", { name: /another one/i }));
    expect(await screen.findByText(/favorite food is ramen/i)).toBeVisible();
  });

  it("updates what Dee is currently into", async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole("button", { name: /start/i }));
    await user.click(screen.getByRole("button", { name: /dee's world/i }));
    await user.type(screen.getByLabelText(/listening to/i), "NIKI");
    await user.type(screen.getByLabelText(/craving/i), "ramen");
    await user.type(screen.getByLabelText(/watching/i), "Formula 1");
    await user.type(
      screen.getByRole("textbox", { name: /^💭 thinking about$/i }),
      "the weekend",
    );
    await user.click(screen.getByRole("button", { name: /save currently/i }));

    expect(screen.getByDisplayValue("NIKI")).toBeVisible();
    expect(screen.getByText(/saved just now/i)).toBeVisible();
  });
});
