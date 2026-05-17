// AX Framework — minimal interactions

document.addEventListener('DOMContentLoaded', () => {

  // Graph node hover — gentle scaling
  document.querySelectorAll('.graph-svg .node').forEach(node => {
    node.style.cursor = 'pointer';
    node.style.transition = 'transform 0.2s';
    node.style.transformOrigin = 'center';
    node.style.transformBox = 'fill-box';

    node.addEventListener('mouseenter', () => {
      node.style.transform = 'scale(1.08)';
    });
    node.addEventListener('mouseleave', () => {
      node.style.transform = 'scale(1)';
    });
  });

  // Intersection observer for section reveals
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -10% 0px' });

    document.querySelectorAll('.section, .app-mockup').forEach(el => {
      observer.observe(el);
    });
  }

  // Mini parallax on hero metrics on scroll
  const metrics = document.querySelector('.hero-metrics');
  if (metrics) {
    let raf;
    window.addEventListener('scroll', () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y < 800) {
          metrics.style.transform = `translateY(${y * 0.05}px)`;
        }
        raf = null;
      });
    }, { passive: true });
  }

  // Update LIVE numbers gently to feel alive
  const activeStat = document.querySelector('.env-pill');
  if (activeStat) {
    setInterval(() => {
      const base = 847;
      const delta = Math.floor(Math.random() * 20) - 10;
      activeStat.innerHTML = `<span class="dot"></span>${base + delta} sessions live`;
    }, 3500);
  }
});
