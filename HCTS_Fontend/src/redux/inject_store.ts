import type { RootState } from ".";

let store;
export const injectStore = (_store:RootState) => {
    store = _store;
};
export { store };