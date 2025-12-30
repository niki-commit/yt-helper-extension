import { browser } from "wxt/browser";

export const isContextValid = () => {
  try {
    return !!browser.runtime.id;
  } catch (e) {
    return false;
  }
};
