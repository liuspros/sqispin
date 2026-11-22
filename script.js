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
const soundBtn = document.getElementById("soundBtn");
const popup = document.getElementById("popup");
const winText = document.getElementById("winText");
const winImage = document.getElementById("winImage");
const confettiCanvas = document.getElementById("confetti");
const confettiCtx = confettiCanvas.getContext("2d");
// new in v2: nav, pages, name box, history page
const navPill = document.getElementById("navPill");
const historyCount = document.getElementById("historyCount");
const pagesBox = document.getElementById("pages");
const pagesTrack = document.getElementById("pagesTrack");
const playerName = document.getElementById("playerName");
const nameMessage = document.getElementById("nameMessage");
const historyList = document.getElementById("historyList");
const historyStats = document.getElementById("historyStats");
const historyEmpty = document.getElementById("historyEmpty");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

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

makeDots();
showSlide(0);
startAutoSlide();

/* =====================================================
   3. THE PRIZES
   Add, remove or rename a prize here and the wheel updates itself.
   ===================================================== */
// price is in naira. CHANGE THESE to your real costs: cheaper prizes win more often
const prizes = [
  { name: "Power Bank", image: "images/powerbank.png", price: 15000 },
  { name: "T-Shirt", image: "images/tshirt.png", price: 4000 },
  { name: "Pen", image: "images/pen.png", price: 300, zoom: 1.4 }, // zoom makes thin items bigger on the wheel
  { name: "Cap", image: "images/cap.png", price: 3000 },
  { name: "Smart Watch", image: "images/watch.png", price: 20000 },
];

// each prize appears twice so the wheel has 10 slices (looks fuller)
const segments = [...prizes, ...prizes];
const sliceAngle = 360 / segments.length; // degrees per slice

// slice colors: blue, white, orange, white ... (pattern repeats)
const sliceColors = ["#1a56ff", "#ffffff", "#ff7a1a", "#ffffff"];
const textColors = ["#ffffff", "#0b1f5c", "#ffffff", "#0b1f5c"];

/* =====================================================
   4. DRAW THE WHEEL ON THE CANVAS
   ===================================================== */
const SIZE = 640;
const C = SIZE / 2; // center point
canvas.width = SIZE;
canvas.height = SIZE;

// load the prize pictures, then draw the wheel when they are all ready
let imagesLoaded = 0;
prizes.forEach(function (prize) {
  prize.img = new Image();
  prize.img.onload = function () {
    imagesLoaded++;
    if (imagesLoaded === prizes.length) drawWheel();
  };
  prize.img.src = prize.image;
});

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
    // -90 degrees so slice 0 starts at the top (12 o'clock), not at 3 o'clock
    const start = (i * sliceAngle - 90) * (Math.PI / 180);
    const end = start + sliceAngle * (Math.PI / 180);

    ctx.beginPath();
    ctx.moveTo(C, C);
    ctx.arc(C, C, R, start, end);
    ctx.closePath();
    ctx.fillStyle = sliceColors[i % sliceColors.length];
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(11, 31, 92, 0.18)";
    ctx.stroke();

    // text + picture, drawn pointing outward from the center
    ctx.save();
    ctx.translate(C, C);
    ctx.rotate(start + (sliceAngle * Math.PI) / 360);

    ctx.fillStyle = textColors[i % textColors.length];
    ctx.font = "700 16px Poppins, Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(segments[i].name, 82, 0);

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
    ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
    ctx.shadowBlur = 6;
    const pic = 46 * (segments[i].zoom || 1); // use zoom if the prize has one, else 1
    ctx.drawImage(segments[i].img, -pic / 2, -pic / 2, pic, pic);
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
   ===================================================== */
let audioCtx;
let soundOn = true;
let lastTickTime = 0;

function startAudio() {
  // browsers only allow sound after a click, so we create it on the SPIN click
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
  if (!soundOn || !audioCtx) return;
  const now = performance.now();
  if (now - lastTickTime < 35) return; // do not stack ticks when the wheel is very fast
  lastTickTime = now;
  beep(1500, 600, 0.06, 0.22, "triangle");
}

function playStart() {
  if (!soundOn || !audioCtx) return;
  beep(250, 900, 0.5, 0.15, "sine");
}

function playWin() {
  if (!soundOn || !audioCtx) return;
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
  notes.forEach(function (freq, i) {
    setTimeout(function () {
      beep(freq, freq, 0.45, 0.2, "triangle");
      beep(freq * 2, freq * 2, 0.3, 0.06, "sine"); // soft sparkle on top
    }, i * 110);
  });
}

function toggleSound() {
  soundOn = !soundOn;
  soundBtn.textContent = soundOn ? "Sound: On" : "Sound: Off";
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

  // step 1: decide the winner FIRST, using the price-weighted odds (see section 10)
  const winnerPrize = pickPrize(); // which PRIZE wins
  const winnerIndex = pickSlice(winnerPrize); // which of its slices the wheel lands on

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
  isSpinning = false;
  spinBtn.disabled = false;
  saveSpin(currentPlayer, segments[winnerIndex]); // write name + prize to the history
  setTimeout(function () {
    showPopup(segments[winnerIndex]);
  }, 600);
}

/* =====================================================
   7. WIN POPUP + CONFETTI
   ===================================================== */
function showPopup(prize) {
  winText.textContent = "You won a " + prize.name;
  winImage.src = prize.image;
  popup.classList.add("show");
  playWin();
  launchConfetti();
}

function closePopup() {
  if (!popup.classList.contains("show")) return; // Escape key must not do anything when no popup is open
  popup.classList.remove("show");
  confettiRunning = false;

  // get the box ready for the next person
  playerName.value = "";
  playerName.disabled = false;
}

document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") closePopup();
});

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
let currentPage = 0;

// tell the CSS how many pages there are (it uses this for the width of the sliding pill)
navPill.style.setProperty("--count", pages.length);

function showPage(index) {
  // CLAMP: the banner loops with %, but pages should NOT loop.
  // Math.min stops us going past the last page, Math.max stops us going below 0.
  currentPage = Math.max(0, Math.min(index, pages.length - 1));

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
   9. SPIN HISTORY (saved in the browser with localStorage)
   NOTE: we call it spinHistory because "history" is already a built-in name in the browser.
   ===================================================== */
const HISTORY_KEY = "spinHistory";

function loadHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch (error) {
    return [];
  }
}
let spinHistory = loadHistory();

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(spinHistory));
  } catch (error) {
    // storage can be blocked (private mode). The spin must still work, so we ignore it
  }
}

function saveSpin(name, prize) {
  spinHistory.push({ name: name, prize: prize.name, time: Date.now() });
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = ""; // safe: we are only clearing, not inserting anything typed by a user
  historyStats.innerHTML = "";

  const hasSpins = spinHistory.length > 0;
  historyEmpty.style.display = hasSpins ? "none" : "block";
  clearHistoryBtn.style.display = hasSpins ? "inline-block" : "none";
  historyCount.textContent = hasSpins ? spinHistory.length : ""; // the little number on the nav
  if (!hasSpins) return;

  // stat cards: total, then how many times each prize has been won
  addStat(spinHistory.length, "Total spins", true);
  prizes.forEach(function (prize) {
    const count = spinHistory.filter(function (item) {
      return item.prize === prize.name;
    }).length;
    addStat(count, prize.name, false);
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
  const prize = prizes.find(function (p) {
    return p.name === item.prize;
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
  if (prize) {
    const thumb = document.createElement("img");
    thumb.className = "history-thumb";
    thumb.src = prize.image;
    thumb.alt = prize.name;
    row.append(thumb);
  }
  row.append(time);
  return row;
}

function clearHistory() {
  if (confirm("Delete the whole spin history?")) {
    spinHistory = [];
    saveHistory();
    renderHistory();
  }
}

renderHistory();

/* =====================================================
   10. WEIGHTED RANDOM (cheap prizes win more often)
   The "range method": give every prize a stretch on a number line.
   A bigger stretch = a bigger chance. Throw a dart, see whose stretch it hits.
   ===================================================== */

// how strongly price matters:
//   0   = every prize has the same chance
//   0.5 = gentle (default)
//   1   = very strong: a prize that costs 10x more wins 10x less often
const PRICE_POWER = 0.5;

// step 1: one weight per prize. Higher price = smaller weight.
function getWeights() {
  return prizes.map(function (prize) {
    return 1 / Math.pow(Math.max(prize.price, 1), PRICE_POWER); // Math.max stops a price of 0 from breaking the maths
  });
}

// step 2 + 3 + 4: build the ranges, throw the dart, find the winner
function pickPrize() {
  const weights = getWeights();
  const total = weights.reduce(function (sum, w) {
    return sum + w;
  }, 0);

  let point = Math.random() * total; // a random spot on the line from 0 to total

  for (let i = 0; i < prizes.length; i++) {
    if (point < weights[i]) return prizes[i]; // the dart landed inside this prize's range
    point -= weights[i]; // no? move past this range and check the next one
  }
  return prizes[prizes.length - 1]; // safety net, it should never be reached
}

// each prize sits on 2 slices of the wheel. Pick one of them at random.
function pickSlice(prize) {
  const options = [];
  for (let i = 0; i < segments.length; i++) {
    if (segments[i] === prize) options.push(i);
  }
  return options[Math.floor(Math.random() * options.length)];
}

/* =====================================================
   11. TESTING TOOLS (type these in the browser console, F12)
   showOdds()        -> the chance of every prize, in %
   simulate(10000)   -> spins 10000 times (no wheel, no history) and counts the wins
   ===================================================== */
function showOdds() {
  const weights = getWeights();
  const total = weights.reduce(function (sum, w) {
    return sum + w;
  }, 0);
  console.table(
    prizes.map(function (prize, i) {
      return {
        prize: prize.name,
        price: prize.price,
        chance: ((weights[i] / total) * 100).toFixed(1) + "%",
      };
    }),
  );
}

function simulate(times) {
  const wins = {};
  prizes.forEach(function (prize) {
    wins[prize.name] = 0;
  });
  for (let i = 0; i < times; i++) {
    wins[pickPrize().name]++;
  }
  console.table(
    prizes.map(function (prize) {
      return {
        prize: prize.name,
        wins: wins[prize.name],
        percent: ((wins[prize.name] / times) * 100).toFixed(1) + "%",
      };
    }),
  );
}
