import { encryptTransform } from "redux-persist-transform-encrypt";
import rootReducer,{ type RootState }from ".";
import { persistReducer, persistStore } from "redux-persist";
import { configureStore, type AnyAction,  } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";

const persistStorage = (storage as any)?.default ?? storage;

const rootReducerWithClear = (state: RootState | undefined, action: AnyAction) => {
  if (action.type === "hcts/clearReduxState") {
    state = undefined;
    localStorage.clear();
    sessionStorage.clear();
  }
  return rootReducer(state, action);
};

// Redux-persist configuration
const persistConfig = {
  key: "HCTS", 
  version: 1,
  storage: persistStorage,
  transforms: [
    encryptTransform({
      secretKey: `hctsencryption`,
      onError: (err) => {
        console.error("Persist Transform Error:", err);
      },
    }),
  ],
};

const persistedReducer = persistReducer<RootState>(
  persistConfig,
  rootReducerWithClear
);

export const store = configureStore({
  reducer: persistedReducer,
  devTools: true,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);