(() => {
  var stored = localStorage.getItem("theme");
  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (stored === "dark" || (stored === null && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor !== null) {
    themeColor.setAttribute(
      "content",
      document.documentElement.classList.contains("dark") ? "#1C1B1F" : "#FAF9FC",
    );
  }
})();
