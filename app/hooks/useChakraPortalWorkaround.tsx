import { useEffect } from "react";

// This is necessary to prevent chakra modals from always rendering on top
// of headless-ui modals. Can be removed once chakra is removed.
export const useChakraPortalWorkaround = () => {
  const chakraPortalElements = document.getElementsByClassName("chakra-portal") as HTMLCollectionOf<HTMLElement>;
  const headlessUIElement = document.getElementById("headlessui-portal-root");
  const body = document.getElementsByTagName("body")[0];

  useEffect(() => {
    setTimeout(() => {
      console.log("chakraPortalElements", chakraPortalElements);
      console.log("headlessUIElement", headlessUIElement);
      if (body) {
        body.style.zIndex = String(chakraPortalElements.length + 1);
      }
      if (chakraPortalElements) {
        for (let i = 0; i < chakraPortalElements.length; i++) {
          chakraPortalElements[i].style.position = "fixed";
          chakraPortalElements[i].style.zIndex = String(chakraPortalElements.length - i);
        }
      }
    });
  });
};
