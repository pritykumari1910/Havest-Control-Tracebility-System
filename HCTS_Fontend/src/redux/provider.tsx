import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { ReactNode } from "react";
import { persistor, store } from "./store"
import { injectStore } from "./inject_store"

interface ReduxProviderProps {
  children: ReactNode;
}

injectStore(store.getState()); // Inject store once

export function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}