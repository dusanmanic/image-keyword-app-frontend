import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import store from "../store/store.js";

/**
 * Render a component wrapped in the app's real Redux store and a router.
 * @param {React.ReactNode} ui
 * @param {{ route?: string }} [options]
 */
export function renderWithProviders(ui, { route = "/" } = {}) {
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </Provider>,
  );
}
