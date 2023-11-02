import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { toastStore } from "@chakra-ui/toast/dist/toast.store";

export const closeAllToasts = async () => {
  // close all toasts before each tests and wait for them to be removed
  toastStore.closeAll();
  const toasts = screen.queryAllByRole("listitem");
  await Promise.all(toasts.map((toasts) => waitForElementToBeRemoved(toasts)));
};
