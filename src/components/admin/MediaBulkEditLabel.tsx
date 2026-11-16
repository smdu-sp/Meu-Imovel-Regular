"use client";

import { useEffect } from "react";

const selector = [
  ".collection-list--media .edit-many__toggle .list-selection__button",
  ".collection-folder-list--media .edit-many__toggle .list-selection__button",
].join(", ");

export function MediaBulkEditLabel() {
  useEffect(() => {
    const updateLabels = () => {
      document.querySelectorAll<HTMLButtonElement>(selector).forEach((button) => {
        if (button.textContent?.trim() !== "Editar em Massa") {
          button.textContent = "Editar em Massa";
        }
        if (button.getAttribute("aria-label") !== "Editar em Massa") {
          button.setAttribute("aria-label", "Editar em Massa");
        }
      });
    };

    const observer = new MutationObserver(updateLabels);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label"],
      childList: true,
      subtree: true,
    });
    updateLabels();
    return () => observer.disconnect();
  }, []);

  return null;
}
