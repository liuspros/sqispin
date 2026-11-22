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
const prizes = [
  { name: "Power Bank", image: "images/powerbank.png" },
  { name: "T-Shirt", image: "images/tshirt.png" },
  { name: "Pen", image: "images/pen.png", zoom: 1.4 }, // zoom makes thin items bigger on the wheel
  { name: "Cap", image: "images/cap.png" },
  { name: "Smart Watch", image: "images/watch.png" },
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

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  startAudio();
  playStart();

  // step 1: decide the winner FIRST (this is what makes it fair and random)
  const winnerIndex = Math.floor(Math.random() * segments.length);

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
  popup.classList.remove("show");
  confettiRunning = false;
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
