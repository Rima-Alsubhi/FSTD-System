/* basic navigation */
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-link]").forEach((el) =>
    el.addEventListener("click", () => {
      const target = el.getAttribute("data-link");

      if (target && target !== "#") {
        window.location.href = target;
      }
    })
  );
});

/* placeholder generator for missing images */
function placeholder(type) {
  const div = document.createElement("div");
  div.className = "placeholder";
  switch (type) {
    case "finance":
      div.innerHTML = icon("calculate", "#a5d6a7");
      break;
    case "manager":
      div.innerHTML = icon("engineering", "#bbdefb");
      break;
    default:
      div.innerHTML = icon("build", "#ffe0b2");
  }
  return div;
}

function icon(name, bg) {
  return `
    <div style="
      background:${bg};
      width:100%;
      height:100%;
      display:flex;
      justify-content:center;
      align-items:center;">
      <span style="font-size:80px;color:#666;">${symbol(name)}</span>
    </div>`;
}

/* simple symbol map (Unicode) */
function symbol(key) {
  const map = {
    calculate: "🖩",
    engineering: "🛠",
    build: "🔧",
  };
  return map[key] || "❔";
}

function navigation(role) {
  localStorage.setItem("selectedRole", role);
  window.location.href = "../HTML/login.html";
}

//y