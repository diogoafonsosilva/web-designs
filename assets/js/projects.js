const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".project-card");
const countEl = document.getElementById("visibleCount");
const emptyState = document.getElementById("emptyState");
const grid = document.getElementById("projectsGrid");

function applyFilter(filter) {
  let count = 0;
  cards.forEach(card => {
    const cats = card.dataset.category || "";
    const match = filter === "all" || cats.split(" ").includes(filter);
    card.style.display = match ? "" : "none";
    if (match) count++;
  });
  countEl.textContent = count;
  emptyState.style.display = count === 0 ? "flex" : "none";
  grid.style.display = count === 0 ? "none" : "";
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => {
      b.classList.remove("active");
      b.setAttribute("aria-pressed", "false");
    });
    btn.classList.add("active");
    btn.setAttribute("aria-pressed", "true");
    applyFilter(btn.dataset.filter);
  });
});

countEl.textContent = cards.length;
