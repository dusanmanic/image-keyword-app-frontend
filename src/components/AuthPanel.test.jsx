import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "../test/renderWithProviders.jsx";

const login = vi.fn();
const register = vi.fn();
const logout = vi.fn();

vi.mock("../hooks/useAuthRedux.js", () => ({
  useAuthRedux: () => ({
    isAuthenticated: false,
    email: "",
    login,
    register,
    logout,
  }),
}));

import AuthPanel from "./AuthPanel.jsx";

// "Login"/"Register" appear twice: once as a tab, once as the submit button.
// The submit button is always the last one in the DOM.
const submitButton = (name) => screen.getAllByRole("button", { name }).at(-1);

beforeEach(() => {
  login.mockReset().mockResolvedValue({ inactive: false });
  register.mockReset().mockResolvedValue({ inactive: false });
});

describe("<AuthPanel>", () => {
  it("shows the login tab by default with a submit button", () => {
    renderWithProviders(<AuthPanel />);
    expect(screen.getByText("Sign in")).toBeInTheDocument();
    expect(submitButton("Login")).toBeInTheDocument();
  });

  it("switches to the register tab", async () => {
    renderWithProviders(<AuthPanel />);
    // on the login tab, "Register" only matches the tab button
    await userEvent.click(screen.getByRole("button", { name: "Register" }));
    expect(screen.getByText("Create account")).toBeInTheDocument();
  });

  it("rejects a short password before calling login", async () => {
    renderWithProviders(<AuthPanel />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "short");
    await userEvent.click(submitButton("Login"));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("rejects an email with no @ before calling login", async () => {
    renderWithProviders(<AuthPanel />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "not-an-email");
    await userEvent.type(screen.getByPlaceholderText("Password"), "longenough1");
    await userEvent.click(submitButton("Login"));

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with the entered credentials when valid", async () => {
    renderWithProviders(<AuthPanel />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
    await userEvent.click(submitButton("Login"));

    expect(login).toHaveBeenCalledWith("user@example.com", "password123");
  });

  it("surfaces a login error message", async () => {
    login.mockRejectedValueOnce(new Error("Invalid credentials"));
    renderWithProviders(<AuthPanel />);
    await userEvent.type(screen.getByPlaceholderText("Email"), "user@example.com");
    await userEvent.type(screen.getByPlaceholderText("Password"), "password123");
    await userEvent.click(submitButton("Login"));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
