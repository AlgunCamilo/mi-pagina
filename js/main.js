// js/mensajes.js  — Cartas y dedicatorias entre dos usuarios (Firebase Auth + Firestore)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, deleteDoc, doc }
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1) Pega aquí la config de tu proyecto Firebase (Configuración del proyecto > Tus apps > Web)
const firebaseConfig = {
    apiKey: "AIzaSyBbG4h3iYrM8S2v6zxevOVQEpOYYHwNlXs",
    authDomain: "hilo-rojo-687ac.firebaseapp.com",
    projectId: "hilo-rojo-687ac",
    storageBucket: "hilo-rojo-687ac.firebasestorage.app",
    messagingSenderId: "603952279425",
    appId: "1:603952279425:web:8753f49be472dc267c4280",
    measurementId: "G-F4PV59N6PB"
  };

// 2) Nombre que se muestra según el correo de cada usuario
const NOMBRES = {
  "militocastell@gmai.com": "Camilo",
  "juanaruiz1619@gmail.com": "Juana"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const $ = (id) => document.getElementById(id);

let usuario = null;
let categoriaActiva = "todos";
let cartas = [];
let stopCartas = null, stopMedia = null;

// ---------- Sesión ----------
$("form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("login-error").textContent = "";
  try {
    await signInWithEmailAndPassword(auth, $("login-email").value.trim(), $("login-pass").value);
  } catch {
    $("login-error").textContent = "Correo o contraseña incorrectos.";
  }
});
$("btn-salir").addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (u) => {
  usuario = u;
  $("zona-login").hidden = !!u;
  $("zona-privada").hidden = !u;
  $("media-privada").hidden = !u;
  if (stopCartas) stopCartas();
  if (stopMedia) stopMedia();
  if (u) {
    $("saludo").textContent = "Hola, " + (NOMBRES[u.email] || u.email);
    escucharCartas();
    escucharMedia();
  }
});

// ---------- Cartas ----------
$("form-carta").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = $("carta-texto-input").value.trim();
  if (!texto) return;
  await addDoc(collection(db, "cartas"), {
    uid: usuario.uid,
    autor: NOMBRES[usuario.email] || usuario.email,
    categoria: $("carta-categoria").value,
    titulo: $("carta-titulo").value.trim(),
    texto,
    creado: serverTimestamp()
  });
  e.target.reset();
});

function escucharCartas() {
  const q = query(collection(db, "cartas"), orderBy("creado", "desc"));
  stopCartas = onSnapshot(q, (snap) => {
    cartas = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    pintarCartas();
  });
}

function pintarCartas() {
  const cont = $("blog-container");
  cont.replaceChildren();
  const lista = cartas.filter((c) => categoriaActiva === "todos" || c.categoria === categoriaActiva);
  if (!lista.length) {
    const vacio = document.createElement("div");
    vacio.className = "loading-text";
    vacio.textContent = "Aún no hay escritos. Escribe el primero…";
    cont.append(vacio);
    return;
  }
  for (const c of lista) {
    const card = document.createElement("article");
    card.className = "recuerdo-card";

    const meta = document.createElement("div");
    meta.className = "recuerdo-meta";
    const izq = document.createElement("span");
    izq.textContent = `${c.autor} · ${c.categoria}`;
    const der = document.createElement("span");
    der.textContent = c.creado?.toDate ? c.creado.toDate().toLocaleDateString("es-CO") : "enviando…";
    meta.append(izq, der);

    const h = document.createElement("h3");
    h.className = "recuerdo-titulo";
    h.textContent = c.titulo || c.categoria;

    const p = document.createElement("p");
    p.className = "recuerdo-texto";
    p.style.whiteSpace = "pre-wrap";
    p.textContent = c.texto; // textContent: evita inyección de HTML

    card.append(meta, h, p);
    if (usuario && c.uid === usuario.uid) {
      const b = document.createElement("button");
      b.className = "btn-mini";
      b.textContent = "Borrar";
      b.onclick = () => confirm("¿Borrar este escrito?") && deleteDoc(doc(db, "cartas", c.id));
      card.append(b);
    }
    cont.append(card);
  }
}

document.querySelectorAll(".filtro-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("activo"));
    btn.classList.add("activo");
    categoriaActiva = btn.dataset.categoria;
    pintarCartas();
  })
);

// ---------- Dedicatorias (YouTube / Spotify) ----------
function aEmbed(url) {
  try {
    const u = new URL(url);
    const h = u.hostname.replace("www.", "");
    if (h === "youtu.be") return { src: "https://www.youtube.com/embed/" + u.pathname.slice(1), alto: 315 };
    if (h.endsWith("youtube.com")) {
      const id = u.searchParams.get("v") || u.pathname.split("/").pop();
      return { src: "https://www.youtube.com/embed/" + encodeURIComponent(id), alto: 315 };
    }
    if (h === "open.spotify.com") {
      // soporta /track/ID, /album/ID, /playlist/ID, /episode/ID (ignora prefijos tipo /intl-es/)
      const partes = u.pathname.split("/").filter(Boolean);
      const i = partes.findIndex((x) => ["track", "album", "playlist", "episode", "show"].includes(x));
      if (i >= 0) return { src: `https://open.spotify.com/embed/${partes[i]}/${partes[i + 1]}`, alto: 152 };
    }
  } catch {}
  return null;
}

$("form-media").addEventListener("submit", async (e) => {
  e.preventDefault();
  const url = $("media-url").value.trim();
  if (!aEmbed(url)) { $("media-error").textContent = "Usa un enlace de YouTube o Spotify."; return; }
  $("media-error").textContent = "";
  await addDoc(collection(db, "dedicatorias"), {
    uid: usuario.uid,
    autor: NOMBRES[usuario.email] || usuario.email,
    url,
    nota: $("media-nota").value.trim(),
    creado: serverTimestamp()
  });
  e.target.reset();
});

function escucharMedia() {
  const q = query(collection(db, "dedicatorias"), orderBy("creado", "desc"));
  stopMedia = onSnapshot(q, (snap) => {
    const cont = $("media-container");
    cont.replaceChildren();
    snap.docs.forEach((d) => {
      const m = d.data();
      const emb = aEmbed(m.url);
      if (!emb) return;
      const w = document.createElement("div");
      w.className = "video-wrapper";
      const f = document.createElement("iframe");
      f.src = emb.src; f.height = emb.alto; f.width = "100%"; f.loading = "lazy";
      f.allow = "autoplay; clipboard-write; encrypted-media; picture-in-picture";
      f.allowFullscreen = true; f.style.border = "0";
      const cap = document.createElement("p");
      cap.className = "video-caption";
      cap.textContent = `${m.autor}${m.nota ? ": " + m.nota : ""}`;
      w.append(f, cap);
      if (usuario && m.uid === usuario.uid) {
        const b = document.createElement("button");
        b.className = "btn-mini";
        b.textContent = "Quitar";
        b.onclick = () => deleteDoc(doc(db, "dedicatorias", d.id));
        w.append(b);
      }
      cont.append(w);
    });
  });
}
