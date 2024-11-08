import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { createToastFn } from "@chakra-ui/toast";

export const closeAllToasts = async () => {
  // close all toasts before each tests and wait for them to be removed
  const toast = createToastFn("ltr", {});
  toast.closeAll();
  const toasts = screen.queryAllByRole("listitem");
  await Promise.all(toasts.map((toasts) => waitForElementToBeRemoved(toasts)));
};
