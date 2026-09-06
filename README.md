# voice-transcription

Aplicación web interactiva que procesa entradas de audio en tiempo real para transcripción de voz y análisis dinámico del espectro sonoro.

## Descripción
Herramienta de análisis acústico y procesamiento de audio. Captura el flujo de entrada del micrófono para realizar transcripción continua y visualización del espectro sonoro (amplitud en dB, frecuencias en Hz y afinación).

## Tecnologías y Herramientas
* **Web Speech API:** Captura y transcripción de voz continua.
* **Web Audio API / p5.sound:** Análisis espectral mediante FFT (Fast Fourier Transform).
* **JavaScript (ES6+):** Gestión asíncrona de eventos de audio y manipulación del DOM.

## Uso
1. Conceder permisos de acceso al micrófono.
2. Hablar para visualizar la transcripción e inspeccionar los datos espectrales en tiempo real.
