// --- Variables para Transcripción (Web Speech API) ---
let recognition;
let transcript = "Haz clic en la pantalla para iniciar el micrófono...";

// --- Variables para Audio Nativo (Web Audio API) ---
let audioCtx;
let analyser;
let micStream;
let audioIniciado = false;

// --- Variables de Datos de la GUI ---
let datosAudio = {
  volumen: 0,
  frecuenciaPrincipal: 0,
  tono: "N/A",
  decibeles: 0
};

// Mapeo de frecuencias aproximadas a notas musicales
const notasMusicales = [
  { nota: 'Do (C)', freq: 261.63 },
  { nota: 'Re (D)', freq: 293.66 },
  { nota: 'Mi (E)', freq: 329.63 },
  { nota: 'Fa (F)', freq: 349.23 },
  { nota: 'Sol (G)', freq: 392.00 },
  { nota: 'La (A)', freq: 440.00 },
  { nota: 'Si (B)', freq: 493.88 }
];

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(20);

  // Configurar la transcripción de voz
  configurarReconocimientoVoz();
}

// Inicia el audio con el primer clic del usuario
async function mousePressed() {
  if (!audioIniciado) {
    try {
      // 1. Solicitar acceso directo al micrófono (Nativo HTML5)
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Crear contexto de audio y analizador
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let source = audioCtx.createMediaStreamSource(micStream);
      
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048; // Tamaño estándar y compatible
      source.connect(analyser);

      audioIniciado = true;

      // 3. Iniciar transcripción
      if (recognition) {
        try { recognition.start(); } catch (e) {}
      }

      transcript = "Micrófono activo. ¡Habla ahora!";
    } catch (err) {
      console.error("Error al acceder al micrófono:", err);
      transcript = "ERROR: No se pudo acceder al micrófono. Revisa los permisos.";
    }
  }
}

function configurarReconocimientoVoz() {
  let SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-ES';

    recognition.onresult = (event) => {
      let current = event.resultIndex;
      transcript = event.results[current][0].transcript;
    };

    recognition.onerror = (event) => {
      console.warn("Error Speech API:", event.error);
    };

    recognition.onend = () => {
      if (audioIniciado) {
        try { recognition.start(); } catch (e) {}
      }
    };
  } else {
    transcript = "Tu navegador no soporta Web Speech API (Usa Google Chrome o MS Edge).";
  }
}

function draw() {
  background(10, 180);

  if (audioIniciado && analyser) {
    analizarAudio();
  }

  // Renderizar la Interfaz
  dibujarGUI();
}

function analizarAudio() {
  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);
  
  // A. Obtener Amplitud / Volumen
  analyser.getByteTimeDomainData(dataArray);
  let sum = 0;
  for (let i = 0; i < bufferLength; i++) {
    let v = (dataArray[i] - 128) / 128;
    sum += v * v;
  }
  let rms = Math.sqrt(sum / bufferLength); // Valor de 0.0 a 1.0
  datosAudio.volumen = rms;

  // B. Decibeles (Aproximados)
  let ampClamped = max(rms, 0.0001);
  datosAudio.decibeles = round(20 * log(ampClamped) / log(10) + 90);

  // C. Frecuencia Dominante
  let freqArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(freqArray);
  
  let maxVal = -1;
  let maxIndex = -1;
  for (let i = 0; i < bufferLength; i++) {
    if (freqArray[i] > maxVal) {
      maxVal = freqArray[i];
      maxIndex = i;
    }
  }
  
  // Convertir índice del array a Hertz (Hz)
  let nyquist = audioCtx.sampleRate / 2;
  let freqHz = round((maxIndex * nyquist) / bufferLength);
  datosAudio.frecuenciaPrincipal = freqHz;

  // D. Estimación de Tono
  datosAudio.tono = calcularTono(freqHz);
}

function dibujarGUI() {
  let margin = 20;
  let panelWidth = (width - margin * 3) / 2;
  let panelHeight = height - margin * 2;

  // PANEL IZQUIERDO: Métricas de Audio
  dibujarPanel(margin, margin, panelWidth, panelHeight, "ANÁLISIS DE AUDIO");
  
  let xUI = margin + 20;
  let yUI = margin + 70;
  let uiSpacing = 80;

  dibujarBarraMedidora(xUI, yUI, panelWidth - 40, "Volumen (Amplitud)", datosAudio.volumen, 0, 1, color(100, 255, 100));
  dibujarBarraMedidora(xUI, yUI + uiSpacing, panelWidth - 40, "Decibeles (dB aprox.)", datosAudio.decibeles, 0, 120, color(255, 100, 100));
  dibujarBarraMedidora(xUI, yUI + uiSpacing * 2, panelWidth - 40, "Frecuencia Principal (Hz)", datosAudio.frecuenciaPrincipal, 0, 3000, color(100, 100, 255));

  fill(255);
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text("Tono estimado (Nota):", xUI, yUI + uiSpacing * 3);
  textSize(50);
  fill(255, 255, 100);
  textStyle(BOLD);
  text(datosAudio.tono, xUI, yUI + uiSpacing * 3 + 40);
  textStyle(NORMAL);

  // PANEL DERECHO: Transcripción
  dibujarPanel(margin * 2 + panelWidth, margin, panelWidth, panelHeight, "TRANSCRIPCIÓN EN TIEMPO REAL");
  
  fill(audioIniciado ? 230 : color(255, 200, 50));
  noStroke();
  textSize(20);
  textAlign(LEFT, TOP);
  text(transcript, margin * 2 + panelWidth + 20, margin + 70, panelWidth - 40, panelHeight - 90);
}

function dibujarPanel(x, y, w, h, titulo) {
  fill(30, 200);
  stroke(60);
  strokeWeight(2);
  rect(x, y, w, h, 10);

  fill(150);
  noStroke();
  textSize(16);
  textAlign(CENTER, TOP);
  textStyle(BOLD);
  text(titulo, x + w / 2, y + 15);
  textStyle(NORMAL);
}

function dibujarBarraMedidora(x, y, w, label, valor, minVal, maxVal, col) {
  let barraHeight = 22;
  
  fill(200);
  noStroke();
  textSize(15);
  textAlign(LEFT, TOP);
  text(label, x, y);
  textAlign(RIGHT, TOP);
  text(nf(valor, 0, 2), x + w, y);

  fill(50);
  rect(x, y + 25, w, barraHeight, 5);

  let fillWidth = map(valor, minVal, maxVal, 0, w, true);
  fill(col);
  rect(x, y + 25, fillWidth, barraHeight, 5);
}

function calcularTono(freq) {
  if (freq < 50 || datosAudio.volumen < 0.02) return "N/A (Silencio)";
  
  let notaMasCercana = notasMusicales[0];
  let diferenciaMinima = abs(freq - notasMusicales[0].freq);

  for (let i = 1; i < notasMusicales.length; i++) {
    let diff = abs(freq - notasMusicales[i].freq);
    if (diff < diferenciaMinima) {
      diferenciaMinima = diff;
      notaMasCercana = notasMusicales[i];
    }
  }
  return notaMasCercana.nota;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}