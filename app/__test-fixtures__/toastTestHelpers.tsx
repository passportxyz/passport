import { screen, waitForElementToBeRemoved } from "@testing-library/react";
import { toast } from "@chakra-ui/react";

export const closeAllToasts = async () => {
  // close all toasts before each tests and wait for them to be removed
  toast.closeAll();
  const toasts = screen.queryAllByRole("listitem");
  await Promise.all(toasts.map((toasts) => waitForElementToBeRemoved(toasts)));
};
