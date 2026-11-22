/* =====================================================
   1. GRAB THE ELEMENTS WE NEED (once, at the top)
   ===================================================== */
const banner = document.getElementById("banner");
const bannerTrack = document.getElementById("bannerTrack");
const bannerDots = document.getElementById("bannerDots");
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");
const pointer = document.getElementById("pointer");
const spinBtn = document.getElementById("spinBtn");
const giftsLeft = document.getElementById("giftsLeft");
const playerName = document.getElementById("playerName");
const nameMessage = document.getElementById("nameMessage");

// popup
const popup = document.getElementById("popup");
const congratsText = document.getElementById("congratsText");
const winText = document.getElementById("winText");
const winImage = document.getElementById("winImage");
const popupNote = document.getElementById("popupNote");
const popupBtn = document.getElementById("popupBtn");
const confettiCanvas = document.getElementById("confetti");
const confettiCtx = confettiCanvas.getContext("2d");

// pages + nav + history
const navPill = document.getElementById("navPill");
const historyCount = document.getElementById("historyCount");
const pagesBox = document.getElementById("pages");
const pagesTrack = document.getElementById("pagesTrack");
const historyList = document.getElementById("historyList");
const historyStats = document.getElementById("historyStats");
const historyEmpty = document.getElementById("historyEmpty");

// organizer settings
const gate = document.getElementById("gate");
const gateText = document.getElementById("gateText");
const gatePass = document.getElementById("gatePass");
const gatePass2 = document.getElementById("gatePass2");
const gateMessage = document.getElementById("gateMessage");
const gateBtn = document.getElementById("gateBtn");
const panel = document.getElementById("panel");
const giftList = document.getElementById("giftList");
const giftForm = document.getElementById("giftForm");
const formTitle = document.getElementById("formTitle");
const formMessage = document.getElementById("formMessage");
const gName = document.getElementById("gName");
const gPrice = document.getElementById("gPrice");
const gStock = document.getElementById("gStock");
const gFile = document.getElementById("gFile");
const gLink = document.getElementById("gLink");
const gPreview = document.getElementById("gPreview");
const tryChanceInput = document.getElementById("tryChanceInput");
const newPass = document.getElementById("newPass");
const newPass2 = document.getElementById("newPass2");
const passMessage = document.getElementById("passMessage");

/* =====================================================
   2. BANNER SLIDER (auto-swipe)
   ===================================================== */
const totalSlides = document.querySelectorAll(".slide").length;
let currentSlide = 0;
let slideTimer;

function makeDots() {
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.onclick = function () {
      showSlide(i);
      resetAutoSlide();
    };
    bannerDots.appendChild(dot);
  }
}

function showSlide(index) {
  // the % trick makes the slides loop: after the last one comes the first
  currentSlide = (index + totalSlides) % totalSlides;
  bannerTrack.style.transform = `translateX(-${currentSlide * 100}%)`;

  const dots = document.querySelectorAll(".dot");
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle("active", i === currentSlide);
  }
}

function nextSlide() {
  showSlide(currentSlide + 1);
  resetAutoSlide();
}

function prevSlide() {
  showSlide(currentSlide - 1);
  resetAutoSlide();
}

function startAutoSlide() {
  slideTimer = setInterval(function () {
    showSlide(currentSlide + 1);
  }, 4000);
}

function resetAutoSlide() {
  clearInterval(slideTimer);
  startAutoSlide();
}

// swipe with finger (or drag with mouse)
let swipeStartX = 0;

banner.addEventListener("pointerdown", function (e) {
  swipeStartX = e.clientX;
});

banner.addEventListener("pointerup", function (e) {
  const distance = e.clientX - swipeStartX;
  if (distance < -50) nextSlide(); // moved left, so go forward
  if (distance > 50) prevSlide(); // moved right, so go back
});

/* =====================================================
   3. DATA: THE GIFTS + SETTINGS (saved in localStorage)
   ===================================================== */
const GIFTS_KEY = "spinGifts";
const SETTINGS_KEY = "spinSettings";
const HISTORY_KEY = "spinHistory";
const MAX_GIFTS = 12; // more than this and the wheel gets too crowded
const PRICE_POWER = 0.5; // 0 = all gifts equal chance, 1 = price matters a lot (see section 10)

// "Try Again" is not a gift, it is a special slice with its own chance
const TRY_AGAIN = { id: "try", name: "Try Again", isTryAgain: true };

// the gifts the site starts with (the organizer can change them in Settings).
// price is in naira. Cheaper gifts win more often. stock = how many are left.
const DEFAULT_GIFTS = [
  { id: "g1", name: "Power Bank", image: "images/powerbank.png", price: 15000, stock: 3 },
  { id: "g2", name: "T-Shirt", image: "images/tshirt.png", price: 4000, stock: 8 },
  { id: "g3", name: "Pen", image: "images/pen.png", price: 300, stock: 20, zoom: 1.4 }, // zoom makes thin items bigger on the wheel
  { id: "g4", name: "Cap", image: "images/cap.png", price: 3000, stock: 10 },
  { id: "g5", name: "Smart Watch", image: "images/watch.png", price: 20000, stock: 2 },
];

// two small helpers so we do not repeat the try/catch everywhere
function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true; // saved
  } catch (error) {
    return false; // storage full or blocked
  }
}

function copyOf(data) {
  return JSON.parse(JSON.stringify(data)); // a full independent copy
}

let gifts = readStorage(GIFTS_KEY, null);
if (!Array.isArray(gifts)) gifts = copyOf(DEFAULT_GIFTS); // first visit: start with the defaults

// Object.assign fills in any setting that is missing
let settings = Object.assign({ tryAgainChance: 20, passHash: "" }, readStorage(SETTINGS_KEY, {}));

function saveGifts() {
  return writeStorage(GIFTS_KEY, gifts);
}

function saveSettings() {
  return writeStorage(SETTINGS_KEY, settings);
}

// gifts that can still be won
function liveGifts() {
  return gifts.filter(function (g) {
    return g.stock > 0;
  });
}

/* =====================================================
   4. THE WHEEL
   The slices are: every gift that is still in stock (once each) + one "Try Again".
   ===================================================== */
const SIZE = 640;
const C = SIZE / 2; // center point
canvas.width = SIZE;
canvas.height = SIZE;

let segments = []; // what is on the wheel right now
let sliceAngle = 360; // degrees per slice

// slice colors: blue, white, orange, white ... (pattern repeats)
const sliceColors = ["#1a56ff", "#ffffff", "#ff7a1a", "#ffffff"];
const textColors = ["#ffffff", "#0b1f5c", "#ffffff", "#0b1f5c"];

function buildWheel() {
  segments = [...liveGifts(), TRY_AGAIN];
  sliceAngle = 360 / segments.length;
  drawWheel();
}

function colorIndexFor(i) {
  let c = i % sliceColors.length;
  // the LAST slice touches the FIRST one. If both would be blue, make the last one orange.
  if (i === segments.length - 1 && c === 0 && i !== 0) c = 2;
  return c;
}

// pictures: load each one only once, and redraw the wheel when it arrives
const imageCache = {};

function getImage(src) {
  if (!imageCache[src]) {
    const img = new Image();
    img.onload = drawWheel;
    img.src = src;
    imageCache[src] = img;
  }
  return imageCache[src];
}

// shorten long names with "..." so they stay inside the slice
function fitText(text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (text.length > 1 && ctx.measureText(text + "…").width > maxWidth) {
    text = text.slice(0, -1);
  }
  return text + "…";
}

// draw a picture inside a square box WITHOUT stretching it
function drawFitted(img, box) {
  const scale = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
}

// the little "refresh" arrow on the Try Again slice (drawn with code, no picture needed)
function drawRetryIcon(radius) {
  const start = -0.35 * Math.PI;
  const end = 1.25 * Math.PI;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(0, 0, radius, start, end);
  ctx.stroke();

  // arrow head at the end of the arc
  const x = Math.cos(end) * radius;
  const y = Math.sin(end) * radius;
  const tx = -Math.sin(end); // direction the arc is travelling
  const ty = Math.cos(end);
  const nx = Math.cos(end); // sideways direction
  const ny = Math.sin(end);
  ctx.beginPath();
  ctx.moveTo(x + tx * 9, y + ty * 9);
  ctx.lineTo(x + nx * 7, y + ny * 7);
  ctx.lineTo(x - nx * 7, y - ny * 7);
  ctx.closePath();
  ctx.fill();
}

function drawWheel() {
  ctx.clearRect(0, 0, SIZE, SIZE);

  // outer rim
  const rim = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  rim.addColorStop(0, "#1a56ff");
  rim.addColorStop(1, "#0b1f5c");
  ctx.beginPath();
  ctx.arc(C, C, 318, 0, Math.PI * 2);
  ctx.fillStyle = rim;
  ctx.fill();

  // little lights around the rim (orange and white, taking turns)
  const lights = 20;
  for (let k = 0; k < lights; k++) {
    const a = (k / lights) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(C + Math.cos(a) * 297, C + Math.sin(a) * 297, 7, 0, Math.PI * 2);
    ctx.fillStyle = k % 2 === 0 ? "#ff9d4d" : "#ffffff";
    ctx.fill();
  }

  // the slices
  const R = 274;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const c = colorIndexFor(i);

    // -90 degrees so slice 0 starts at the top (12 o'clock), not at 3 o'clock
    const start = (i * sliceAngle - 90) * (Math.PI / 180);
    const end = start + sliceAngle * (Math.PI / 180);

    ctx.beginPath();
    ctx.moveTo(C, C);
    ctx.arc(C, C, R, start, end);
    ctx.closePath();
    ctx.fillStyle = sliceColors[c];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(11, 31, 92, 0.18)";
    ctx.stroke();

    // text + picture, drawn pointing outward from the center
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(start + (sliceAngle * Math.PI) / 360);

    ctx.fillStyle = textColors[c];
    ctx.font = "700 16px Poppins, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(fitText(seg.name, 112), 82, 0);

    // a round blue chip behind the picture, so white items (like the T-shirt) still show
    ctx.beginPath();
    ctx.arc(228, 0, 31, 0, Math.PI * 2);
    const chip = ctx.createRadialGradient(220, -8, 4, 228, 0, 31);
    chip.addColorStop(0, "#6f9bff");
    chip.addColorStop(1, "#1a3fbf");
    ctx.fillStyle = chip;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    ctx.save();
    ctx.translate(228, 0);
    ctx.rotate(Math.PI / 2); // stand the picture upright along the slice
    if (seg.isTryAgain) {
      drawRetryIcon(14);
    } else {
      const img = getImage(seg.image);
      if (img.complete && img.naturalWidth > 0) {
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 6;
        drawFitted(img, 46 * (seg.zoom || 1)); // use zoom if the gift has one, else 1
      }
    }
    ctx.restore();

    ctx.restore();
  }

  // soft shine over the whole wheel
  const shine = ctx.createRadialGradient(C, C, 40, C, C, R);
  shine.addColorStop(0, "rgba(255, 255, 255, 0.22)");
  shine.addColorStop(1, "rgba(0, 0, 0, 0.1)");
  ctx.beginPath();
  ctx.arc(C, C, R, 0, Math.PI * 2);
  ctx.fillStyle = shine;
  ctx.fill();

  // center ring (the SPIN button sits on top of it)
  ctx.beginPath();
  ctx.arc(C, C, 76, 0, Math.PI * 2);
  ctx.fillStyle = "#0b1f5c";
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
}

/* =====================================================
   5. SOUND (made with code, so no download and it works offline)
   Sound is always on. Browsers only allow it after a click, which is the SPIN click.
   ===================================================== */
let audioCtx;
let lastTickTime = 0;

function startAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function beep(freqStart, freqEnd, length, volume, type) {
  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(freqEnd, t + length);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + length);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(t);
  osc.stop(t + length);
}

function playTick() {
  if (!audioCtx) return;
  const now = performance.now();
  if (now - lastTickTime < 35) return; // do not stack ticks when the wheel is very fast
  lastTickTime = now;
  beep(1500, 600, 0.06, 0.22, "triangle");
}

function playStart() {
  if (!audioCtx) return;
  beep(250, 900, 0.5, 0.15, "sine");
}

function playWin() {
  if (!audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
  notes.forEach(function (freq, i) {
    setTimeout(function () {
      beep(freq, freq, 0.45, 0.2, "triangle");
      beep(freq * 2, freq * 2, 0.3, 0.06, "sine"); // soft sparkle on top
    }, i * 110);
  });
}

function playTryAgain() {
  if (!audioCtx) return;
  const notes = [392, 330, 262]; // three notes going down = "aww"
  notes.forEach(function (freq, i) {
    setTimeout(function () {
      beep(freq, freq * 0.97, 0.32, 0.18, "triangle");
    }, i * 170);
  });
}

/* =====================================================
   6. SPINNING
   ===================================================== */
let rotation = 0; // how far the wheel has turned, in degrees
let isSpinning = false;
let currentPlayer = ""; // the name of the person who is spinning right now

// pressing Enter inside the name box also spins
playerName.addEventListener("keydown", function (e) {
  if (e.key === "Enter") spin();
});

function spin() {
  if (isSpinning) return;

  // nothing left to win
  if (liveGifts().length === 0) {
    nameMessage.textContent = "All gifts have been won. Thank you for coming!";
    return;
  }

  // the name is required before every spin
  const name = playerName.value.trim();
  if (name === "") {
    nameMessage.textContent = "Enter your name first";
    playerName.classList.add("shake");
    setTimeout(function () {
      playerName.classList.remove("shake");
    }, 500);
    playerName.focus();
    return;
  }
  nameMessage.textContent = "";
  currentPlayer = name;
  playerName.disabled = true; // lock the box while the wheel is turning

  isSpinning = true;
  spinBtn.disabled = true;
  startAudio();
  playStart();

  // step 1: decide the result FIRST, using the odds (see section 10)
  const result = pickResult(); // a gift, or TRY_AGAIN
  const winnerIndex = segments.indexOf(result); // every slice is unique now, so indexOf finds it

  // step 2: work out how far to turn so that slice stops under the pointer
  // the little random offset stops it from always landing dead-center
  const offset = (Math.random() - 0.5) * sliceAngle * 0.6;
  const wantedAngle = (360 - ((winnerIndex + 0.5) * sliceAngle + offset)) % 360;
  const currentAngle = rotation % 360;
  const extra = (wantedAngle - currentAngle + 360) % 360;
  const fullTurns = 5 + Math.floor(Math.random() * 3); // 5 to 7 full rounds
  const totalTurn = fullTurns * 360 + extra;

  const startRotation = rotation;
  const startTime = performance.now();
  const duration = 5500; // milliseconds
  let lastSlice = -1;

  // step 3: animate. This function runs again and again, once per screen refresh
  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 4); // fast at first, slows down at the end
    rotation = startRotation + totalTurn * eased;
    canvas.style.transform = `rotate(${rotation}deg)`;

    // which slice is under the pointer right now? tick when it changes
    const sliceNow = Math.floor(((360 - (rotation % 360)) % 360) / sliceAngle);
    if (sliceNow !== lastSlice) {
      if (lastSlice !== -1) tickEffect();
      lastSlice = sliceNow;
    }

    if (t < 1) {
      requestAnimationFrame(frame);
    } else {
      finishSpin(winnerIndex);
    }
  }
  requestAnimationFrame(frame);
}

function tickEffect() {
  playTick();
  pointer.classList.add("tick");
  setTimeout(function () {
    pointer.classList.remove("tick");
  }, 70);
}

function finishSpin(winnerIndex) {
  const result = segments[winnerIndex];
  isSpinning = false;
  spinBtn.disabled = false;

  if (!result.isTryAgain) {
    result.stock = Math.max(0, result.stock - 1); // one less in stock
    saveGifts();
    saveSpin(currentPlayer, result); // write name + gift to the history
  }
  renderGiftsLeft(); // the "gifts left" strip updates straight away

  setTimeout(function () {
    showPopup(result);
  }, 600);
}

/* =====================================================
   7. RESULT POPUP (win or try again) + CONFETTI
   ===================================================== */
let popupIsTryAgain = false;

// "a Pen", "an Umbrella"
function withArticle(word) {
  return (/^[aeiou]/i.test(word) ? "an " : "a ") + word;
}

function showPopup(result) {
  popupIsTryAgain = Boolean(result.isTryAgain);

  if (popupIsTryAgain) {
    congratsText.textContent = "Oh no!";
    winText.textContent = "Try again!";
    winImage.src = TRY_AGAIN_IMAGE;
    popupNote.textContent = "Not this time. Your name is still in, so spin again!";
    popupBtn.textContent = "Spin again";
    playTryAgain();
  } else {
    congratsText.textContent = "Congratulations!";
    winText.textContent = "You won " + withArticle(result.name);
    winImage.src = result.image;
    popupNote.textContent = "Show this screen at the SQI Tech Fest desk to claim your gift.";
    popupBtn.textContent = "Awesome!";
    playWin();
    launchConfetti();
  }
  popup.classList.add("show");
}

function closePopup() {
  if (!popup.classList.contains("show")) return; // Escape key must not do anything when no popup is open
  popup.classList.remove("show");
  confettiRunning = false;

  playerName.disabled = false;
  if (!popupIsTryAgain) playerName.value = ""; // a winner is done. "Try again" keeps the same name
  buildWheel(); // a gift that just ran out disappears from the wheel
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closePopup();
});

// the picture for "Try again": a refresh arrow, written as SVG text
const TRY_AGAIN_IMAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<path d="M63.6 23.3 A30 30 0 1 1 28.8 28.8" fill="none" stroke="#ff7a1a" stroke-width="9" stroke-linecap="round"/>' +
      '<path d="M37.4 20.6 L21.4 22.3 L36.6 36.6 Z" fill="#ff7a1a"/>' +
      "</svg>",
  );

let confettiRunning = false;

function launchConfetti() {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const colors = ["#1a56ff", "#ff7a1a", "#ffffff", "#7aa5ff", "#ffb26b"];
  const pieces = [];

  for (let i = 0; i < 140; i++) {
    pieces.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * -confettiCanvas.height * 0.5,
      size: 6 + Math.random() * 8,
      speedY: 2 + Math.random() * 4,
      speedX: (Math.random() - 0.5) * 3,
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  confettiRunning = true;

  function draw() {
    if (!confettiRunning) {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      return;
    }
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let stillFalling = false;

    pieces.forEach(function (p) {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += p.spin;
      if (p.y < confettiCanvas.height + 20) stillFalling = true;

      confettiCtx.save();
      confettiCtx.translate(p.x, p.y);
      confettiCtx.rotate((p.angle * Math.PI) / 180);
      confettiCtx.fillStyle = p.color;
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      confettiCtx.restore();
    });

    if (stillFalling) requestAnimationFrame(draw);
  }
  draw();
}

/* =====================================================
   8. PAGES + FLOATING NAV
   Same idea as the banner: a long strip that slides left and right.
   ===================================================== */
const pages = document.querySelectorAll(".page");
const navButtons = document.querySelectorAll(".nav-btn");
const SETTINGS_PAGE = 2;
let currentPage = 0;

// tell the CSS how many pages there are (it uses this for the width of the sliding pill)
navPill.style.setProperty("--count", pages.length);

function showPage(index) {
  if (isSpinning) return; // no page changes while the wheel is turning

  // CLAMP: the banner loops with %, but pages should NOT loop.
  // Math.min stops us going past the last page, Math.max stops us going below 0.
  currentPage = Math.max(0, Math.min(index, pages.length - 1));

  if (currentPage !== SETTINGS_PAGE) lockSettings(); // leaving Settings locks it again
  pages[currentPage].classList.remove("inactive"); // wake up the page we are going to
  pagesTrack.style.transform = `translateX(-${currentPage * 100}%)`;
  navPill.style.setProperty("--index", currentPage); // CSS moves the white pill because of this

  navButtons.forEach(function (btn, i) {
    btn.classList.toggle("active", i === currentPage);
  });
  window.scrollTo(0, 0);

  // when the slide has finished, put the other pages to sleep
  setTimeout(function () {
    pages.forEach(function (page, i) {
      if (i !== currentPage) page.classList.add("inactive");
    });
  }, 700);
}

// swipe left / right with a finger to change page
let pageStartX = 0;
let pageStartY = 0;

pagesBox.addEventListener("pointerdown", function (e) {
  pageStartX = e.clientX;
  pageStartY = e.clientY;
});

pagesBox.addEventListener("pointerup", function (e) {
  if (e.pointerType === "mouse") return; // fingers only. Mouse users have the nav pill
  if (e.target.closest("#banner") || e.target.closest("input")) return; // the banner has its own swipe
  if (isSpinning || popup.classList.contains("show")) return;

  const moveX = e.clientX - pageStartX;
  const moveY = e.clientY - pageStartY;

  // must be a long and mostly sideways move, so scrolling down the page does not count
  if (Math.abs(moveX) < 70 || Math.abs(moveX) < Math.abs(moveY) * 1.5) return;

  if (moveX < 0) showPage(currentPage + 1); // finger moved left, so go forward
  else showPage(currentPage - 1); // finger moved right, so go back
});

/* =====================================================
   9. WINNER HISTORY (saved in the browser with localStorage)
   NOTE: we call it spinHistory because "history" is already a built-in name in the browser.
   Only wins are saved. "Try Again" is not a win.
   ===================================================== */
function loadHistory() {
  const saved = readStorage(HISTORY_KEY, []);
  return Array.isArray(saved) ? saved : [];
}
let spinHistory = loadHistory();

function saveHistory() {
  writeStorage(HISTORY_KEY, spinHistory);
}

function saveSpin(name, gift) {
  spinHistory.push({ name: name, prize: gift.name, time: Date.now() });
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = ""; // safe: we are only clearing, not inserting anything typed by a user
  historyStats.innerHTML = "";

  const hasSpins = spinHistory.length > 0;
  historyEmpty.style.display = hasSpins ? "none" : "block";
  historyCount.textContent = hasSpins ? spinHistory.length : ""; // the little number on the nav
  if (!hasSpins) return;

  // stat cards: total, then how many times each gift has been won
  addStat(spinHistory.length, "Total wins", true);
  const names = [...new Set(spinHistory.map(function (item) { return item.prize; }))];
  names.forEach(function (prizeName) {
    const count = spinHistory.filter(function (item) {
      return item.prize === prizeName;
    }).length;
    addStat(count, prizeName, false);
  });

  // newest first, so we count backwards
  for (let i = spinHistory.length - 1; i >= 0; i--) {
    historyList.appendChild(makeRow(spinHistory[i]));
  }
}

function addStat(number, label, isTotal) {
  const card = document.createElement("div");
  card.className = isTotal ? "stat total" : "stat";
  const big = document.createElement("strong");
  big.textContent = number;
  const small = document.createElement("span");
  small.textContent = label;
  card.append(big, small);
  historyStats.appendChild(card);
}

// SECURITY: a name is typed by a user, so we use textContent (plain text) and never innerHTML.
// If someone types <img onerror=...> as their name, textContent just shows those letters.
function makeRow(item) {
  const gift = gifts.find(function (g) {
    return g.name === item.prize;
  });

  const row = document.createElement("div");
  row.className = "history-row";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = item.name.charAt(0).toUpperCase();

  const info = document.createElement("div");
  info.className = "history-info";
  const name = document.createElement("div");
  name.className = "history-name";
  name.textContent = item.name;
  const won = document.createElement("div");
  won.className = "history-prize";
  const prizeName = document.createElement("b");
  prizeName.textContent = item.prize;
  won.append("won ", prizeName);
  info.append(name, won);

  const time = document.createElement("div");
  time.className = "history-time";
  time.textContent = new Date(item.time).toLocaleString([], {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });

  row.append(avatar, info);
  if (gift) {
    const thumb = document.createElement("img");
    thumb.className = "history-thumb";
    thumb.src = gift.image;
    thumb.alt = gift.name;
    row.append(thumb);
  }
  row.append(time);
  return row;
}

function clearHistory() {
  if (confirm("Delete the whole winner history?")) {
    spinHistory = [];
    saveHistory();
    renderHistory();
  }
}

/* =====================================================
   10. THE ODDS: "RANGE METHOD" WEIGHTED RANDOM
   Every slice gets a stretch on a number line from 0 to 100.
   A bigger stretch = a bigger chance. Throw a dart, see whose stretch it hits.
   ===================================================== */

// returns a list like [{ item: Pen, percent: 43 }, ..., { item: TRY_AGAIN, percent: 20 }]
// the percents always add up to 100
function getOdds() {
  const live = liveGifts();
  const tryPercent = live.length === 0 ? 100 : settings.tryAgainChance;

  // gift weights: higher price = smaller weight
  const weights = live.map(function (g) {
    return 1 / Math.pow(Math.max(g.price, 1), PRICE_POWER); // Math.max stops a price of 0 from breaking the maths
  });
  const total = weights.reduce(function (sum, w) {
    return sum + w;
  }, 0);

  // the gifts share whatever is left after Try Again takes its part
  const odds = live.map(function (g, i) {
    return { item: g, percent: ((100 - tryPercent) * weights[i]) / total };
  });
  odds.push({ item: TRY_AGAIN, percent: tryPercent });
  return odds;
}

function pickResult() {
  const odds = getOdds();
  let point = Math.random() * 100; // a random spot on the line from 0 to 100

  for (let i = 0; i < odds.length; i++) {
    if (point < odds[i].percent) return odds[i].item; // the dart landed inside this stretch
    point -= odds[i].percent; // no? move past it and check the next one
  }
  return odds[odds.length - 1].item; // safety net, it should never be reached
}

/* =====================================================
   11. "GIFTS LEFT" STRIP (visible to everyone, under the wheel)
   ===================================================== */
function renderGiftsLeft() {
  giftsLeft.innerHTML = "";
  if (gifts.length === 0) return;

  const title = document.createElement("div");
  title.className = "left-title";
  title.textContent = liveGifts().length === 0 ? "All gifts claimed" : "Gifts left";
  giftsLeft.appendChild(title);

  gifts.forEach(function (g) {
    const chip = document.createElement("span");
    chip.className = "left-chip";
    if (g.stock === 0) chip.classList.add("out");
    else if (g.stock <= 2) chip.classList.add("low");
    chip.title = g.name;

    const img = document.createElement("img");
    img.src = g.image;
    img.alt = g.name;
    chip.append(img, "×" + g.stock); // "x" sign + number
    giftsLeft.appendChild(chip);
  });
}

/* =====================================================
   12. ORGANIZER SETTINGS
   NOTE ON SECURITY: everything here lives in the browser, so the password only keeps
   curious spinners out. It cannot stop someone who knows how to open the developer tools.
   For real protection the data must live on a server (for example Firebase).
   ===================================================== */
let organizerUnlocked = false;

// ---- password hashing (we never store the password itself) ----
async function hashText(text) {
  if (window.crypto && crypto.subtle) {
    const bytes = new TextEncoder().encode("sqi-spin:" + text);
    const buffer = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(buffer))
      .map(function (b) {
        return b.toString(16).padStart(2, "0");
      })
      .join("");
  }
  // fallback for very old browsers: a simple hash
  let h = 5381;
  const salted = "sqi-spin:" + text;
  for (let i = 0; i < salted.length; i++) h = ((h << 5) + h + salted.charCodeAt(i)) | 0;
  return "x" + h;
}

function setMessage(element, text, isGood) {
  element.textContent = text;
  element.style.color = isGood ? "#12a150" : "#e02424";
}

// ---- lock screen ----
function refreshSettingsView() {
  gate.style.display = organizerUnlocked ? "none" : "block";
  panel.style.display = organizerUnlocked ? "block" : "none";

  if (organizerUnlocked) {
    renderGiftList();
    tryChanceInput.value = settings.tryAgainChance;
    return;
  }

  const firstTime = settings.passHash === "";
  gateText.textContent = firstTime
    ? "First time here. Create the organizer password."
    : "Enter the organizer password.";
  gatePass2.style.display = firstTime ? "block" : "none";
  gateBtn.textContent = firstTime ? "Create password" : "Unlock";
}

async function submitGate() {
  const pass = gatePass.value;
  const firstTime = settings.passHash === "";

  if (pass.length < 4) {
    setMessage(gateMessage, "Use at least 4 characters", false);
    return;
  }

  if (firstTime) {
    if (pass !== gatePass2.value) {
      setMessage(gateMessage, "The two passwords do not match", false);
      return;
    }
    settings.passHash = await hashText(pass);
    saveSettings();
  } else if ((await hashText(pass)) !== settings.passHash) {
    setMessage(gateMessage, "Wrong password", false);
    gatePass.classList.add("shake");
    setTimeout(function () {
      gatePass.classList.remove("shake");
    }, 500);
    return;
  }

  organizerUnlocked = true;
  gatePass.value = "";
  gatePass2.value = "";
  gateMessage.textContent = "";
  refreshSettingsView();
}

function lockSettings() {
  organizerUnlocked = false;
  closeGiftForm();
  gatePass.value = "";
  gatePass2.value = "";
  gateMessage.textContent = "";
  refreshSettingsView();
}

gatePass.addEventListener("keydown", function (e) {
  if (e.key === "Enter") submitGate();
});
gatePass2.addEventListener("keydown", function (e) {
  if (e.key === "Enter") submitGate();
});

// ---- after ANY change to the gifts, refresh everything that shows them ----
function refreshEverything() {
  buildWheel();
  renderGiftsLeft();
  renderGiftList();
  renderHistory();
}

// ---- the list of gifts (with + / - buttons for stock) ----
function renderGiftList() {
  giftList.innerHTML = "";
  if (gifts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "No gifts yet. Add one below.";
    giftList.appendChild(empty);
    return;
  }

  const odds = getOdds();

  gifts.forEach(function (g) {
    const row = document.createElement("div");
    row.className = "gift-row";

    const thumb = document.createElement("img");
    thumb.className = "gift-thumb";
    thumb.src = g.image;
    thumb.alt = g.name;

    const info = document.createElement("div");
    info.className = "gift-info";
    const name = document.createElement("div");
    name.className = "gift-name";
    name.textContent = g.name; // textContent, not innerHTML (the name is typed by a person)
    const meta = document.createElement("div");
    meta.className = "gift-meta";
    const entry = odds.find(function (o) {
      return o.item === g;
    });
    const chance = entry ? entry.percent.toFixed(1) + "% chance" : "sold out";
    meta.textContent = "₦" + Number(g.price).toLocaleString("en-NG") + " · " + chance;
    info.append(name, meta);

    const stepper = document.createElement("div");
    stepper.className = "stepper";
    const minus = document.createElement("button");
    minus.textContent = "−";
    minus.onclick = function () {
      adjustStock(g.id, -1);
    };
    const count = document.createElement("span");
    count.textContent = g.stock;
    const plus = document.createElement("button");
    plus.textContent = "+";
    plus.onclick = function () {
      adjustStock(g.id, 1);
    };
    stepper.append(minus, count, plus);

    const buttons = document.createElement("div");
    buttons.className = "gift-buttons";
    const edit = document.createElement("button");
    edit.className = "btn btn-ghost btn-small";
    edit.textContent = "Edit";
    edit.onclick = function () {
      openGiftForm(g.id);
    };
    const del = document.createElement("button");
    del.className = "btn btn-danger btn-small";
    del.textContent = "Delete";
    del.onclick = function () {
      deleteGift(g.id);
    };
    buttons.append(edit, del);

    row.append(thumb, info, stepper, buttons);
    giftList.appendChild(row);
  });
}

function adjustStock(id, change) {
  const gift = gifts.find(function (g) {
    return g.id === id;
  });
  if (!gift) return;
  gift.stock = Math.max(0, gift.stock + change);
  saveGifts();
  refreshEverything();
}

function deleteGift(id) {
  const gift = gifts.find(function (g) {
    return g.id === id;
  });
  if (!gift) return;
  if (!confirm('Delete "' + gift.name + '"?')) return;
  gifts = gifts.filter(function (g) {
    return g.id !== id;
  });
  saveGifts();
  refreshEverything();
}

// ---- add / edit form ----
let editingId = null; // null = adding a new gift, otherwise the id of the gift being edited
let pendingImage = ""; // the compressed picture chosen from the phone/computer

function openGiftForm(id) {
  editingId = id;
  const gift = gifts.find(function (g) {
    return g.id === id;
  });

  formTitle.textContent = gift ? "Edit gift" : "Add gift";
  gName.value = gift ? gift.name : "";
  gPrice.value = gift ? gift.price : "";
  gStock.value = gift ? gift.stock : "";
  gFile.value = "";
  gLink.value = "";
  pendingImage = "";
  formMessage.textContent = "";
  showPreview(gift ? gift.image : "");

  giftForm.style.display = "block";
  giftForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

function closeGiftForm() {
  giftForm.style.display = "none";
  editingId = null;
  pendingImage = "";
}

function showPreview(src) {
  gPreview.src = src;
  gPreview.style.display = src ? "block" : "none";
}

// shrink the chosen picture to max 300px and turn it into text (a "data URL").
// WebP keeps the transparent background and is tiny, so localStorage does not fill up.
function readImageFile(file, done) {
  const reader = new FileReader();
  reader.onload = function () {
    const img = new Image();
    img.onload = function () {
      const scale = Math.min(1, 300 / Math.max(img.width, img.height));
      const small = document.createElement("canvas");
      small.width = Math.max(1, Math.round(img.width * scale));
      small.height = Math.max(1, Math.round(img.height * scale));
      small.getContext("2d").drawImage(img, 0, 0, small.width, small.height);
      done(small.toDataURL("image/webp", 0.85));
    };
    img.onerror = function () {
      setMessage(formMessage, "That file is not a picture", false);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function onFileChosen() {
  const file = gFile.files[0];
  if (!file) return;
  gLink.value = ""; // file and link do not mix: the last one chosen wins
  formMessage.textContent = "";
  readImageFile(file, function (dataUrl) {
    pendingImage = dataUrl;
    showPreview(dataUrl);
  });
}

function onLinkTyped() {
  pendingImage = "";
  gFile.value = "";
  showPreview(gLink.value.trim());
}

function saveGift() {
  const existing = gifts.find(function (g) {
    return g.id === editingId;
  });
  const name = gName.value.trim();
  const price = Number(gPrice.value);
  const stock = Math.floor(Number(gStock.value));
  const link = gLink.value.trim();
  const image = pendingImage || link || (existing ? existing.image : "");

  if (name === "") return setMessage(formMessage, "Give the gift a name", false);
  if (!(price > 0)) return setMessage(formMessage, "Enter a price above 0", false);
  if (gStock.value === "" || !(stock >= 0)) return setMessage(formMessage, "Enter how many are available", false);
  if (image === "") return setMessage(formMessage, "Add a picture (upload or link)", false);
  if (link && !pendingImage && !/^https?:\/\//i.test(link)) return setMessage(formMessage, "The link must start with http", false);
  if (!existing && gifts.length >= MAX_GIFTS) return setMessage(formMessage, "Maximum " + MAX_GIFTS + " gifts on the wheel", false);

  const backup = copyOf(gifts); // so we can undo if the browser storage is full
  if (existing) {
    existing.name = name;
    existing.price = price;
    existing.stock = stock;
    existing.image = image;
  } else {
    gifts.push({ id: "g" + Date.now(), name: name, price: price, stock: stock, image: image });
  }

  if (!saveGifts()) {
    gifts = backup;
    return setMessage(formMessage, "Storage is full. Use a smaller picture.", false);
  }
  closeGiftForm();
  refreshEverything();
}

// ---- Try Again chance, password, reset ----
function updateTryChance() {
  const value = Number(tryChanceInput.value);
  if (tryChanceInput.value === "" || isNaN(value)) return; // still typing
  settings.tryAgainChance = Math.max(0, Math.min(90, value)); // keep it between 0 and 90
  saveSettings();
  renderGiftList(); // the chances shown in the list change too
}

async function changePassword() {
  if (newPass.value.length < 4) return setMessage(passMessage, "Use at least 4 characters", false);
  if (newPass.value !== newPass2.value) return setMessage(passMessage, "The two passwords do not match", false);
  settings.passHash = await hashText(newPass.value);
  saveSettings();
  newPass.value = "";
  newPass2.value = "";
  setMessage(passMessage, "Password changed", true);
}

function resetGifts() {
  if (!confirm("Put back the 5 starting gifts and their stock? Your own gifts will be deleted.")) return;
  gifts = copyOf(DEFAULT_GIFTS);
  saveGifts();
  refreshEverything();
}

/* =====================================================
   13. TESTING TOOLS (type these in the browser console, F12)
   showOdds()        -> the chance of every slice, in %
   simulate(10000)   -> picks 10000 results (no wheel, no stock change) and counts them
   ===================================================== */
function showOdds() {
  console.table(
    getOdds().map(function (o) {
      return { slice: o.item.name, price: o.item.price || "-", chance: o.percent.toFixed(1) + "%" };
    }),
  );
}

function simulate(times) {
  const wins = {};
  getOdds().forEach(function (o) {
    wins[o.item.name] = 0;
  });
  for (let i = 0; i < times; i++) {
    wins[pickResult().name]++;
  }
  console.table(
    Object.keys(wins).map(function (key) {
      return { slice: key, count: wins[key], percent: ((wins[key] / times) * 100).toFixed(1) + "%" };
    }),
  );
}

/* =====================================================
   14. START EVERYTHING
   ===================================================== */
makeDots();
showSlide(0);
startAutoSlide();
buildWheel();
renderGiftsLeft();
renderHistory();
refreshSettingsView();
