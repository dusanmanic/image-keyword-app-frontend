import { describe, it, expect } from "vitest";
import store from "./store.js";
import * as actions from "./actions.js";

// The store is a singleton; each test dispatches from a known baseline.
function reset() {
  store.dispatch(actions.clearAuth());
  store.dispatch(actions.setFolders([]));
  store.dispatch(actions.setSelectedFolder(null));
  store.dispatch(actions.clearToast());
  store.dispatch(actions.hideSpinner());
  store.dispatch(actions.setError(null));
  store.dispatch(actions.setLoading(false));
}

describe("root reducer", () => {
  it("starts authenticated=false with an empty token", () => {
    reset();
    const s = store.getState();
    expect(s.isAuthenticated).toBe(false);
    expect(s.token).toBe("");
  });

  it("setToken / setEmail / setAuthenticated update auth state", () => {
    reset();
    store.dispatch(actions.setToken("jwt-123"));
    store.dispatch(actions.setEmail("a@b.c"));
    store.dispatch(actions.setAuthenticated(true));
    const s = store.getState();
    expect(s.token).toBe("jwt-123");
    expect(s.email).toBe("a@b.c");
    expect(s.isAuthenticated).toBe(true);
  });

  it("clearAuth wipes token/email/isAuthenticated and resets ToS", () => {
    store.dispatch(actions.setToken("x"));
    store.dispatch(actions.setEmail("x@y.z"));
    store.dispatch(actions.setAuthenticated(true));
    store.dispatch(actions.setTosFromMe(true, "content", "v2"));

    store.dispatch(actions.clearAuth());
    const s = store.getState();
    expect(s).toMatchObject({
      token: "",
      email: "",
      isAuthenticated: false,
      isActive: true,
      tosAccepted: null,
      tosContent: null,
      tosVersion: null,
    });
  });

  it("setTosFromMe records acceptance flag, content and version", () => {
    reset();
    store.dispatch(actions.setTosFromMe(false, "You must agree", "v3"));
    const s = store.getState();
    expect(s.tosAccepted).toBe(false);
    expect(s.tosContent).toBe("You must agree");
    expect(s.tosVersion).toBe("v3");
  });

  it("setIsActive toggles the active flag", () => {
    reset();
    store.dispatch(actions.setIsActive(false));
    expect(store.getState().isActive).toBe(false);
    store.dispatch(actions.setIsActive(true));
    expect(store.getState().isActive).toBe(true);
  });

  it("folder actions: set / add / update / remove", () => {
    reset();
    store.dispatch(actions.setFolders([{ id: "a", name: "A" }]));
    store.dispatch(actions.addFolder({ id: "b", name: "B" }));
    expect(store.getState().folders.map((f) => f.id)).toEqual(["a", "b"]);

    store.dispatch(actions.updateFolder({ id: "a", name: "A2" }));
    expect(store.getState().folders.find((f) => f.id === "a").name).toBe("A2");

    store.dispatch(actions.removeFolder("a"));
    expect(store.getState().folders.map((f) => f.id)).toEqual(["b"]);
  });

  it("UI actions: spinner and toast", () => {
    reset();
    store.dispatch(actions.showSpinner("Saving…"));
    expect(store.getState().uiLoading).toBe("Saving…");
    store.dispatch(actions.hideSpinner());
    expect(store.getState().uiLoading).toBe(false);

    store.dispatch(actions.showToast({ type: "error", message: "Nope" }));
    expect(store.getState().toast).toEqual({ type: "error", message: "Nope" });
    store.dispatch(actions.clearToast());
    expect(store.getState().toast).toBe(null);
  });

  it("ignores unknown actions", () => {
    reset();
    const before = store.getState();
    store.dispatch({ type: "TOTALLY_UNKNOWN" });
    expect(store.getState()).toEqual(before);
  });
});
