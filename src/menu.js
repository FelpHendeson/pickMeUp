const aboutToggle = document.querySelector("[data-about-toggle]");
const aboutPanel = document.querySelector("#aboutPanel");
const playLink = document.querySelector("[data-play-link]");

function closeAboutPanel() {
  if (!aboutToggle || !aboutPanel) {
    return;
  }

  aboutPanel.hidden = true;
  aboutToggle.setAttribute("aria-expanded", "false");
}

if (aboutToggle && aboutPanel) {
  aboutToggle.addEventListener("click", () => {
    const isOpen = aboutToggle.getAttribute("aria-expanded") === "true";

    aboutPanel.hidden = isOpen;
    aboutToggle.setAttribute("aria-expanded", String(!isOpen));

    if (!isOpen) {
      aboutPanel.focus({ preventScroll: true });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAboutPanel();
      aboutToggle.focus();
    }
  });
}

if (playLink) {
  playLink.addEventListener("click", () => {
    document.body.classList.add("is-entering");
  });
}
