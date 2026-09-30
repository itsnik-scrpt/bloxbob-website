const themeButton = document.getElementById("theme-toggle");
const savedTheme = localStorage.getItem("bloxbob-theme");
const initialTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "dark";
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  if (themeButton) {
    themeButton.textContent = theme === "light" ? "Dark mode" : "Light mode";
    themeButton.setAttribute("aria-label", "Switch to " + (theme === "light" ? "dark" : "light") + " mode");
  }
}
setTheme(initialTheme);
themeButton?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  setTheme(next);
  localStorage.setItem("bloxbob-theme", next);
});
document.querySelectorAll("[data-copy]").forEach(button => {
  button.addEventListener("click", async () => {
    const original = button.textContent;
    const value = button.getAttribute("data-copy");
    try {
      await navigator.clipboard.writeText(value);
      button.textContent = "Copied";
      setTimeout(() => { button.textContent = original; }, 1700);
    } catch {
      button.textContent = value;
    }
  });
});
