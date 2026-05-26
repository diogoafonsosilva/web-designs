/* Nav scroll state */
const nav = document.getElementById("nav");
window.addEventListener("scroll", () => {
  nav.classList.toggle("scrolled", window.scrollY > 40);
}, { passive: true });

/* Stagger reveal helper */
function staggerReveal(items, baseDelay = 0, step = 90) {
  items.forEach((el, i) => {
    const delay = baseDelay + i * step;
    el.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.add("revealed");
        setTimeout(() => {
          el.style.transition = "";
        }, 700 + delay);
      });
    });
  });
}

/* Intersection observer for reveals */
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;

    if (el.classList.contains("projects-grid")) {
      staggerReveal(el.querySelectorAll(".project-card"));
    } else if (el.classList.contains("skills-list")) {
      staggerReveal(el.querySelectorAll(".skill-row"), 0, 80);
    } else if (el.classList.contains("timeline")) {
      staggerReveal(el.querySelectorAll(".timeline-item"), 0, 100);
    } else {
      el.classList.add("in");
    }

    observer.unobserve(el);
  });
}, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

/* Active nav link on scroll */
const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-links a");
const scrollObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    navLinks.forEach(a => {
      a.style.color = a.getAttribute("href") === `#${id}` ? "var(--text)" : "";
    });
  });
}, { threshold: 0.4 });

sections.forEach(s => scrollObserver.observe(s));
