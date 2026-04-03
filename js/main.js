// ===== PARTÍCULAS FLOTANTES =====
const canvas = document.getElementById('particulas');
const ctx = canvas.getContext('2d');

function ajustarCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
ajustarCanvas();
window.addEventListener('resize', ajustarCanvas);

const particulas = Array.from({ length: 60 }, () => ({
  x: Math.random() * window.innerWidth,
  y: Math.random() * window.innerHeight,
  r: Math.random() * 1.3 + 0.3,
  vx: (Math.random() - 0.5) * 0.18,
  vy: -Math.random() * 0.28 - 0.05,
  op: Math.random() * 0.3 + 0.05,
  pulso: Math.random() * Math.PI * 2
}));

function animarParticulas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particulas.forEach(p => {
    p.pulso += 0.007;
    p.x += p.vx;
    p.y += p.vy;
    if (p.y < -5) { p.y = canvas.height + 5; p.x = Math.random() * canvas.width; }
    if (p.x < 0) p.x = canvas.width;
    if (p.x > canvas.width) p.x = 0;
    const opActual = p.op * (0.6 + 0.4 * Math.sin(p.pulso));
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(184,148,63,${opActual})`;
    ctx.fill();
  });
  requestAnimationFrame(animarParticulas);
}
animarParticulas();

// ===== LIGHTBOX =====
function abrirLightbox(elemento) {
  const src = elemento.querySelector('img').src;
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox').classList.add('activo');
  document.body.style.overflow = 'hidden';
}

function cerrarLightbox() {
  document.getElementById('lightbox').classList.remove('activo');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') cerrarLightbox();
});

// ===== PUNTOS DE NAVEGACIÓN =====
const dots = document.querySelectorAll('.dot');
const secciones = document.querySelectorAll('section');

const obs = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const idx = [...secciones].indexOf(entry.target);
      dots.forEach(d => d.classList.remove('activo'));
      if (dots[idx]) dots[idx].classList.add('activo');
    }
  });
}, { threshold: 0.5 });

secciones.forEach(s => obs.observe(s));

// ===== APARICIÓN SUAVE AL HACER SCROLL =====
const observador = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.recuerdo-card, .galeria-item, .video-wrapper').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(28px)';
  el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
  observador.observe(el);
});