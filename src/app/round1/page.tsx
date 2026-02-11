'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Hand, Octagon } from 'lucide-react';
import { Button } from '@/components/ui';
import { ROUTES, getRoundConfig, EASY_PERSONAS } from '@/constants';
import { useGameStore } from '@/stores';
import type { PersonaData } from '@/types';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useSettingsStore } from '@/stores/settings-store';

// ============================================
// ROUND 1 PAGE - Roleta 3D com Loop Infinito
// ============================================

const PERSONA_COLORS: Record<number, { bg: string; border: string; glow: string }> = {
  0: { bg: 'from-pink-500 to-rose-600', border: 'border-pink-500', glow: 'shadow-pink-500/50' },
  1: { bg: 'from-purple-500 to-indigo-600', border: 'border-purple-500', glow: 'shadow-purple-500/50' },
  2: { bg: 'from-amber-500 to-orange-600', border: 'border-amber-500', glow: 'shadow-amber-500/50' },
  3: { bg: 'from-teal-500 to-cyan-600', border: 'border-teal-500', glow: 'shadow-teal-500/50' },
  4: { bg: 'from-red-500 to-rose-600', border: 'border-red-500', glow: 'shadow-red-500/50' },
};

type SpinState = 'idle' | 'dragging' | 'spinning' | 'stopping' | 'stopped' | 'revealing' | 'done';

// Constantes do carrossel 3D
const CARD_SPACING = 120; // Espaçamento entre cards
const MIN_VELOCITY = 0.08;
const MAX_VELOCITY = 0.4; // Velocidade máxima permitida
const AUTO_STOP_DURATION = 4000; // 4 segundos para parar automaticamente
const INITIAL_SPIN_VELOCITY = 0.25; // Velocidade inicial do spin
const FINAL_SPIN_VELOCITY = 0.05; // Velocidade final antes de parar

// Chave do localStorage para persistir o resultado
const STORAGE_KEY = 'desenrola_round1_result';

export default function Round1Page() {
  const router = useRouter();
  const { selectPersonaForRound, setRoundPlaying, rounds } = useGameStore();
  const { play } = useSoundKit();
  const { tap, success } = useHaptics();
  const { soundEnabled, masterVolume } = useSettingsStore();

  const [spinState, setSpinState] = useState<SpinState>('idle');
  const [selectedPersona, setSelectedPersona] = useState<PersonaData | null>(null);
  const [rotation, setRotation] = useState(0); // Rotação contínua em "unidades de card"

  const lastDragX = useRef(0);
  const lastDragTime = useRef(0);
  const velocityRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const spinStartTime = useRef<number>(0);
  const spinDirection = useRef<number>(1);
  const initialSpinVelocity = useRef<number>(0); // Velocidade inicial capturada do arrasto
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioReadyRef = useRef<boolean>(false);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const lastTickIndex = useRef<number>(0);

  const roundConfig = getRoundConfig(1);
  const totalPersonas = EASY_PERSONAS.length;

  // Se o round 1 já foi respondido, redireciona para o round 2
  useEffect(() => {
    if (rounds[0]?.status === 'completed') {
      router.replace(ROUTES.ROUND_2);
    }
  }, [rounds, router]);

  // Carrega resultado salvo do localStorage (persistência após F5)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { personaId } = JSON.parse(saved);
        const persona = EASY_PERSONAS.find(p => p.persona.id === personaId);
        if (persona) {
          setSelectedPersona(persona);
          setSpinState('done');
          // Posiciona a rotação no índice da persona salva
          const index = EASY_PERSONAS.indexOf(persona);
          setRotation(index);
        }
      } catch (e) {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  // Pré-carrega o áudio da roleta INSTANTANEAMENTE assim que a página carrega
  useEffect(() => {
    const preloadAudio = async () => {
      try {
        // PASSO 1: Pré-carrega usando HTMLAudioElement (INSTANTÂNEO! ~50-200ms)
        // HTMLAudioElement decodifica MP3 nativamente, muito mais rápido que AudioContext
        const audio = new Audio('/sounds/wheel-spin.mp3');
        audio.preload = 'auto';
        audio.volume = 0; // Silencioso para não incomodar

        // Força o browser a carregar é decodificar AGORA
        audio.load();

        // Aguarda o áudio estar 100% pronto (decodificado é em cache)
        await new Promise<void>((resolve) => {
          const onReady = () => {
            console.log('✅ Áudio da roleta PRÉ-CARREGADO é PRONTO (HTMLAudioElement)!');
            // MARCA COMO PRONTO IMEDIATAMENTE!
            audioReadyRef.current = true;
            resolve();
          };

          audio.addEventListener('canplaythrough', onReady, { once: true });

          // Timeout de segurança (500ms máximo)
          setTimeout(() => {
            if (!audioReadyRef.current) {
              console.log('⚡ Áudio pronto via timeout (fallback)');
              audioReadyRef.current = true;
            }
            resolve();
          }, 500);
        });

        // PASSO 2: Em paralelo, inicializa AudioContext para Web Audio API
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        const ctx = audioContextRef.current;

        // PASSO 3: Decodifica AudioBuffer em BACKGROUND (não bloqueia!)
        // O arquivo já está em cache do PASSO 1, então é rápido
        const response = await fetch('/sounds/wheel-spin.mp3');
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        audioBufferRef.current = audioBuffer;

        console.log('✅ AudioBuffer decodificado (Web Audio API)!');
      } catch (error) {
        console.warn('⚠️ Erro no pré-carregamento:', error);
        // Garante que o áudio está marcado como pronto mesmo com erro
        audioReadyRef.current = true;
      }
    };

    preloadAudio();
  }, []);

  // Cleanup do AudioContext ao desmontar
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Resume o AudioContext na primeira interação (política de autoplay dos navegadores)
  const initAudioContext = useCallback(() => {
    // Garante que o AudioContext existe (fallback caso o preload falhe)
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;

    // Resume o contexto se estiver suspenso (necessário por políticas de autoplay)
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log('🔊 AudioContext resumido na primeira interação');
      }).catch(e => {
        console.warn('Erro ao resumir AudioContext:', e);
      });
    }

    // Marca como pronto se ainda não estiver (fallback)
    if (!audioReadyRef.current) {
      audioReadyRef.current = true;
      console.log('✅ Áudio marcado como pronto via initAudioContext');
    }
  }, []);

// ============================================
  // SOM DE TICK ESTILO CASSINO/SLOT MACHINE
  // ============================================
  // Tick metálico curto, mecânico, sem melodia
  // Volume: 0.45 ~ 0.6 (percebido)
  // PlaybackRate: 0.9 + |velocity| * 0.6, clamp [0.9, 1.6]
  // ============================================
  const playTick = useCallback((velocity: number = 1) => {
    // Respeita configuração de som do usuário
    if (!soundEnabled) return;
    
    const ctx = audioContextRef.current;
    if (!ctx || !audioReadyRef.current) return;

    // Garante que o contexto está rodando
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const now = ctx.currentTime;
      
      // ========================================
      // PLAYBACK RATE DINÂMICO (baseado na velocidade)
      // Giro lento → som mais grave e espaçado
      // Giro rápido → som mais agudo e rápido
      // ========================================
      const absVelocity = Math.abs(velocity);
      const playbackRate = Math.max(0.9, Math.min(1.6, 0.9 + absVelocity * 0.6));
      
      // ========================================
      // VOLUME PERCEBIDO ALTO (0.45 ~ 0.6)
      // Ajustado pelo masterVolume do settings
      // ========================================
      const baseVolume = 0.5; // Volume base alto
      const velocityBoost = Math.min(absVelocity * 0.1, 0.1); // Boost por velocidade
      const finalVolume = Math.min((baseVolume + velocityBoost) * masterVolume, 0.6);
      
      // ========================================
      // SOM 1: CLICK METÁLICO PRINCIPAL
      // Simula o "tick" de uma engrenagem/roda
      // ========================================
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      const clickFilter = ctx.createBiquadFilter();
      
      // Som de impacto metálico (frequência alta com decay rápido)
      clickOsc.type = 'square';
      clickOsc.frequency.setValueAtTime(1200 * playbackRate, now);
      clickOsc.frequency.exponentialRampToValueAtTime(400 * playbackRate, now + 0.015);
      
      // Filtro para dar característica metálica
      clickFilter.type = 'bandpass';
      clickFilter.frequency.value = 2000 * playbackRate;
      clickFilter.Q.value = 2;
      
      // Envelope muito curto (tick mecânico)
      clickGain.gain.setValueAtTime(finalVolume, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      
      clickOsc.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);
      
      clickOsc.start(now);
      clickOsc.stop(now + 0.04);
      
      // ========================================
      // SOM 2: TRANSIENTE DE IMPACTO (PUNCH)
      // Dá a sensação de "peso" mecânico
      // ========================================
      const punchOsc = ctx.createOscillator();
      const punchGain = ctx.createGain();
      
      punchOsc.type = 'sine';
      punchOsc.frequency.setValueAtTime(150 * playbackRate, now);
      punchOsc.frequency.exponentialRampToValueAtTime(60, now + 0.02);
      
      punchGain.gain.setValueAtTime(finalVolume * 0.7, now);
      punchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      
      punchOsc.connect(punchGain);
      punchGain.connect(ctx.destination);
      
      punchOsc.start(now);
      punchOsc.stop(now + 0.03);
      
      // ========================================
      // SOM 3: RUÍDO DE CLICK (textura mecânica)
      // ========================================
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i++) {
        noiseData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (noiseData.length * 0.1));
      }
      
      const noiseSource = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 3000;
      
      noiseGain.gain.setValueAtTime(finalVolume * 0.4, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      
      noiseSource.start(now);
      
    } catch (e) {
      // Ignora erros de áudio para não quebrar a experiência
    }
  }, [soundEnabled, masterVolume]);

  // ============================================
  // SOM DE PARADA FINAL (MÁXIMO IMPACTO DOPAMINÉRGICO)
  // ============================================
  // "Clack" grave + impacto de decisão final
  // Este é o maior pico emocional da roleta
  // ============================================
  const playStopSound = useCallback(() => {
    // Respeita configuração de som do usuário
    if (!soundEnabled) return;
    
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Garante que o contexto está rodando
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      const now = ctx.currentTime;
      const stopVolume = 0.55 * masterVolume; // Volume alto para impacto
      
      // ========================================
      // SOM 1: IMPACTO GRAVE PRINCIPAL (THUD)
      // O "clack" pesado de decisão final
      // ========================================
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      
      thudOsc.type = 'sine';
      thudOsc.frequency.setValueAtTime(120, now);
      thudOsc.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      
      thudGain.gain.setValueAtTime(stopVolume, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      thudOsc.connect(thudGain);
      thudGain.connect(ctx.destination);
      
      thudOsc.start(now);
      thudOsc.stop(now + 0.2);
      
      // ========================================
      // SOM 2: CLICK METÁLICO DE TRAVA
      // Sensação de "travou no lugar"
      // ========================================
      const lockOsc = ctx.createOscillator();
      const lockGain = ctx.createGain();
      const lockFilter = ctx.createBiquadFilter();
      
      lockOsc.type = 'square';
      lockOsc.frequency.setValueAtTime(800, now);
      lockOsc.frequency.exponentialRampToValueAtTime(200, now + 0.03);
      
      lockFilter.type = 'lowpass';
      lockFilter.frequency.value = 1500;
      lockFilter.Q.value = 3;
      
      lockGain.gain.setValueAtTime(stopVolume * 0.8, now);
      lockGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      
      lockOsc.connect(lockFilter);
      lockFilter.connect(lockGain);
      lockGain.connect(ctx.destination);
      
      lockOsc.start(now);
      lockOsc.stop(now + 0.08);
      
      // ========================================
      // SOM 3: RESSONÂNCIA METÁLICA
      // Dá a sensação de "peso" da decisão
      // ========================================
      const resOsc = ctx.createOscillator();
      const resGain = ctx.createGain();
      
      resOsc.type = 'sine';
      resOsc.frequency.setValueAtTime(220, now);
      resOsc.frequency.exponentialRampToValueAtTime(180, now + 0.1);
      
      resGain.gain.setValueAtTime(stopVolume * 0.4, now);
      resGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      
      resOsc.connect(resGain);
      resGain.connect(ctx.destination);
      
      resOsc.start(now);
      resOsc.stop(now + 0.15);
      
      // ========================================
      // SOM 4: RUÍDO DE IMPACTO
      // Textura de material físico
      // ========================================
      const impactBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const impactData = impactBuffer.getChannelData(0);
      for (let i = 0; i < impactData.length; i++) {
        // Ruído com envelope de impacto
        const env = Math.exp(-i / (impactData.length * 0.15));
        impactData[i] = (Math.random() * 2 - 1) * env;
      }
      
      const impactSource = ctx.createBufferSource();
      const impactGain = ctx.createGain();
      const impactFilter = ctx.createBiquadFilter();
      
      impactSource.buffer = impactBuffer;
      
      impactFilter.type = 'bandpass';
      impactFilter.frequency.value = 600;
      impactFilter.Q.value = 1;
      
      impactGain.gain.setValueAtTime(stopVolume * 0.5, now);
      impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      
      impactSource.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(ctx.destination);
      
      impactSource.start(now);
      
    } catch (e) {
      // Ignora erros de áudio
    }
  }, [soundEnabled, masterVolume]);

  // Som de recompensa/dopamina - chime ascendente com harmônicos
  const playRewardSound = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Garante que o contexto está rodando
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    try {
      // Notas do acorde de sucesso (C major arpejo ascendente + oitava)
      const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const startTime = ctx.currentTime;
      const noteDelay = 0.08; // Delay entre cada nota
      const noteDuration = 0.4;

      frequencies.forEach((freq, index) => {
        // Oscilador principal (sine para som limpo)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;

        // Envelope ADSR suave
        const noteStart = startTime + index * noteDelay;
        const volume = 0.15 - index * 0.02; // Volume decresce levemente

        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(volume, noteStart + 0.02); // Attack rápido
        gain.gain.exponentialRampToValueAtTime(volume * 0.7, noteStart + 0.1); // Decay
        gain.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration); // Release

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);

        // Adiciona harmônico (oitava acima, mais suave) para brilho
        const oscHarmonic = ctx.createOscillator();
        const gainHarmonic = ctx.createGain();

        oscHarmonic.type = 'sine';
        oscHarmonic.frequency.value = freq * 2; // Oitava acima

        gainHarmonic.gain.setValueAtTime(0, noteStart);
        gainHarmonic.gain.linearRampToValueAtTime(volume * 0.3, noteStart + 0.02);
        gainHarmonic.gain.exponentialRampToValueAtTime(0.01, noteStart + noteDuration * 0.7);

        oscHarmonic.connect(gainHarmonic);
        gainHarmonic.connect(ctx.destination);

        oscHarmonic.start(noteStart);
        oscHarmonic.stop(noteStart + noteDuration);
      });

      // "Shimmer" final - sweep de frequência para sensação de realização
      const shimmerOsc = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      const shimmerStart = startTime + frequencies.length * noteDelay;

      shimmerOsc.type = 'sine';
      shimmerOsc.frequency.setValueAtTime(1046.50, shimmerStart);
      shimmerOsc.frequency.exponentialRampToValueAtTime(2093, shimmerStart + 0.3);

      shimmerGain.gain.setValueAtTime(0.08, shimmerStart);
      shimmerGain.gain.exponentialRampToValueAtTime(0.01, shimmerStart + 0.4);

      shimmerOsc.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);

      shimmerOsc.start(shimmerStart);
      shimmerOsc.stop(shimmerStart + 0.4);
    } catch (e) {
      // Ignora erros de áudio
    }
  }, []);

  // Toca tick quando passa por um card
  useEffect(() => {
    const currentIndex = Math.floor(rotation);
    if (currentIndex !== lastTickIndex.current) {
      const isActive = spinState === 'dragging' || spinState === 'spinning' || spinState === 'stopping';
      if (isActive) {
        playTick(velocityRef.current);
      }
      lastTickIndex.current = currentIndex;
    }
  }, [rotation, spinState, playTick]);

  // Normaliza o índice para sempre estar entre 0 é totalPersonas-1
  const normalizeIndex = (index: number) => {
    let normalized = index % totalPersonas;
    if (normalized < 0) normalized += totalPersonas;
    return normalized;
  };

  // Pega o índice central atual
  const getCenterIndex = useCallback(() => {
    return normalizeIndex(Math.round(rotation));
  }, [rotation, totalPersonas]);

  // Loop de física para spinning com desaceleração gradual baseada na velocidade do usuário
  useEffect(() => {
    if (spinState !== 'spinning') {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    // Captura a velocidade inicial do arrasto do usuário
    initialSpinVelocity.current = Math.abs(velocityRef.current);
    spinStartTime.current = Date.now();
    spinDirection.current = velocityRef.current >= 0 ? 1 : -1;

    // Duração proporcional à velocidade inicial (mais rápido = mais tempo para parar)
    // Mínimo 2s, máximo 5s baseado na velocidade
    const velocityRatio = initialSpinVelocity.current / MAX_VELOCITY;
    const spinDuration = 2000 + (velocityRatio * 3000);

    const tick = () => {
      const elapsed = Date.now() - spinStartTime.current;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Desaceleração suave usando easing cúbico (easeOutCubic)
      // Começa na velocidade do usuário é vai diminuindo gradualmente
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentVelocity = initialSpinVelocity.current * (1 - eased);

      // Aplica a velocidade com a direção correta
      const velocity = spinDirection.current * Math.max(currentVelocity, FINAL_SPIN_VELOCITY * (1 - progress));

      setRotation(prev => prev + velocity);
      velocityRef.current = velocity;

      // Para quando a velocidade ficar muito baixa ou o tempo acabar
      if (progress >= 1 || Math.abs(velocity) < 0.01) {
        setSpinState('stopping');
        return;
      }

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinState]);

  // Stopping - FÍSICA REALISTA frame-by-frame (como roleta de cassino real)
  useEffect(() => {
    if (spinState !== 'stopping') return;

    // ========================================
    // FASE 1: DESACELERAÇÃO NATURAL (fricção constante)
    // ========================================

    let currentVel = velocityRef.current;
    const direction = currentVel >= 0 ? 1 : -1;
    let currentRot = rotation;

    // Fricção/desaceleração constante aplicada a cada frame
    // Ajustada para ser SUAVE é REALISTA
    const FRICTION = 0.008; // Quanto maior, mais rápido desacelera
    const MIN_VELOCITY = 0.003; // Velocidade mínima antes de parar completamente

    console.log(`🎯 Iniciando parada natural - Velocidade: ${Math.abs(currentVel).toFixed(3)}`);

    const naturalDeceleration = () => {
      // Aplica fricção (desaceleração constante)
      const absVel = Math.abs(currentVel);

      if (absVel > MIN_VELOCITY) {
        // Reduz velocidade gradualmente (fricção)
        currentVel = currentVel * (1 - FRICTION);

        // Atualiza posição baseado na velocidade atual
        currentRot += currentVel;

        setRotation(currentRot);
        velocityRef.current = currentVel;

        // Continua desacelerando
        animationRef.current = requestAnimationFrame(naturalDeceleration);
      } else {
        // Velocidade chegou perto de zero - parar naturalmente
        console.log(`✅ Parada natural em: ${currentRot.toFixed(2)}`);

        // ========================================
        // FASE 2: AJUSTE FINO para centralizar no card mais próximo
        // ========================================

        // Encontra o card mais PRÓXIMO de onde parou naturalmente
        const nearestCardRotation = Math.round(currentRot);
        const targetIndex = normalizeIndex(nearestCardRotation);
        
        // Seleciona a persona que está no card onde parou
        const persona = EASY_PERSONAS[targetIndex];
        setSelectedPersona(persona);
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ personaId: persona.persona.id }));

        console.log(`🎯 Card vencedor: #${targetIndex} (${persona.persona.name}) na posição ${nearestCardRotation.toFixed(2)}`);

        // Calcula a distância mínima para ajustar
        const adjustDistance = nearestCardRotation - currentRot;

        console.log(`🎯 Ajuste fino: ${adjustDistance.toFixed(2)} unidades (de ${currentRot.toFixed(2)} → ${nearestCardRotation.toFixed(2)})`);

        // Anima suavemente para centralizar no card (ajuste pequeno é rápido)
        const adjustStartRot = currentRot;
        const adjustStartTime = Date.now();
        const adjustDuration = Math.min(Math.abs(adjustDistance) * 300, 500); // Máx 500ms

        const finalAdjustment = () => {
          const elapsed = Date.now() - adjustStartTime;
          const progress = Math.min(elapsed / adjustDuration, 1);

          // Easing suave para o ajuste final
          const eased = 1 - Math.pow(1 - progress, 3);
          const newRot = adjustStartRot + (adjustDistance * eased);

          setRotation(newRot);
          velocityRef.current = 0;

          if (progress < 1) {
            animationRef.current = requestAnimationFrame(finalAdjustment);
          } else {
            setRotation(nearestCardRotation);
            // Som de "clunk" final ao parar
            playStopSound(); // Som de parada final (máximo impacto)
            setSpinState('stopped');
            console.log(`🏁 Parada final em: ${nearestCardRotation.toFixed(2)} (card #${targetIndex} - ${persona.persona.name})`);
          }
        };

        animationRef.current = requestAnimationFrame(finalAdjustment);
      }
    };

    // Inicia a desaceleração natural
    animationRef.current = requestAnimationFrame(naturalDeceleration);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinState, totalPersonas, playStopSound]);

  // Stopped -> Revealing (com som de recompensa)
  useEffect(() => {
    if (spinState !== 'stopped') return;
    const timeout = setTimeout(() => {
      // play('sparkle', { cooldownMs: 200 }); // TEMPORARIAMENTE DESLIGADO
      tap();
      playRewardSound(); // Toca som de dopamina ao revelar
      setSpinState('revealing');
    }, 600);
    return () => clearTimeout(timeout);
  }, [spinState, playRewardSound, play, tap]);

  // Revealing -> Done
  useEffect(() => {
    if (spinState !== 'revealing') return;
    const timeout = setTimeout(() => {
      play('win', { volumeOverride: 0.35 });
      success();
      setSpinState('done');
    }, 1000);
    return () => clearTimeout(timeout);
  }, [spinState, play, success]);

  // Velocidade mínima para entrar em spinning
  const MIN_SPIN_VELOCITY = 0.15;

  // Drag handlers - usa document para permitir arrastar em qualquer lugar
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (spinState !== 'idle' && spinState !== 'dragging') return;

    // Inicializa o AudioContext na primeira interação do usuário
    initAudioContext();

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    lastDragX.current = clientX;
    lastDragTime.current = Date.now();
    velocityRef.current = 0;
    setSpinState('dragging');
  }, [spinState, initAudioContext]);

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (spinState !== 'dragging') return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const now = Date.now();
    const dt = Math.max(now - lastDragTime.current, 1);
    const dx = clientX - lastDragX.current;

    // Converte pixels em rotação (movimento fluido)
    const rotationDelta = dx / CARD_SPACING;
    setRotation(prev => prev - rotationDelta);

    // Calcula velocidade
    const instantVelocity = (-dx / CARD_SPACING) / dt * 16;
    let newVelocity = velocityRef.current * 0.7 + instantVelocity * 0.3;

    // Limita a velocidade máxima
    newVelocity = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, newVelocity));
    velocityRef.current = newVelocity;

    lastDragX.current = clientX;
    lastDragTime.current = now;
  }, [spinState]);

  const handleDragEnd = useCallback(() => {
    if (spinState !== 'dragging') return;

    // Só entra em spinning se tiver velocidade suficiente
    if (Math.abs(velocityRef.current) > MIN_SPIN_VELOCITY) {
      // Garante que a velocidade inicial do spin não exceda o máximo
      velocityRef.current = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, velocityRef.current));
      setSpinState('spinning');
    } else {
      setSpinState('idle');
    }
  }, [spinState]);

  // Adiciona listeners globais quando está arrastando
  useEffect(() => {
    if (spinState !== 'dragging') return;

    const onMove = (e: MouseEvent | TouchEvent) => handleDragMove(e);
    const onEnd = () => handleDragEnd();

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onEnd);

    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onEnd);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [spinState, handleDragMove, handleDragEnd]);

  const handleStop = useCallback(() => {
    if (spinState !== 'spinning') return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    setSpinState('stopping');
  }, [spinState]);

  // Som de clique satisfatório para o botão (microestímulo de dopamina)
  const playButtonClickSound = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Som principal - "pop" satisfatório
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.1);

      // Harmônico agudo para brilho
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1760, now);
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.06);
      gain2.gain.setValueAtTime(0.15, now);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now);
      osc2.stop(now + 0.08);

      // Sub bass para "peso"
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(110, now);
      gain3.gain.setValueAtTime(0.2, now);
      gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now);
      osc3.stop(now + 0.12);
    } catch (e) {
      // Ignora erros de áudio
    }
  }, []);

  const handleContinue = useCallback(() => {
    if (selectedPersona) {
      playButtonClickSound();
      selectPersonaForRound(1, selectedPersona);
      setRoundPlaying(1);
      router.push(ROUTES.DUELO_ROUND);
    }
  }, [selectedPersona, selectPersonaForRound, setRoundPlaying, router, playButtonClickSound]);

  const handleSpinAgain = useCallback(() => {
    // Limpa o resultado salvo
    localStorage.removeItem(STORAGE_KEY);
    
    // Reseta todos os estados
    setSelectedPersona(null);
    setSpinState('idle');
    setRotation(0);
    velocityRef.current = 0;
    lastTickIndex.current = 0;
    
    // Toca som de clique
    playButtonClickSound();
    
    console.log('🔄 Roleta resetada - pronta para girar novamente!');
  }, [playButtonClickSound]);

  // Cores do card selecionado
  const colors = selectedPersona
    ? PERSONA_COLORS[EASY_PERSONAS.indexOf(selectedPersona)] || PERSONA_COLORS[0]
    : PERSONA_COLORS[0];

  const isIdle = spinState === 'idle';
  const isDragging = spinState === 'dragging';
  const isSpinning = spinState === 'spinning';
  const isStopping = spinState === 'stopping';
  const isStopped = spinState === 'stopped';
  const isRevealing = spinState === 'revealing';
  const isDone = spinState === 'done';

  const showCarousel = isIdle || isDragging || isSpinning || isStopping || isStopped;

  // Calcula posição 3D de cada card
  const getCardTransform = (index: number) => {
    // Offset relativo ao centro (pode ser fracionário para movimento suave)
    let offset = index - rotation;

    // Normaliza para loop infinito (-2.5 a 2.5 para 5 cards)
    while (offset > totalPersonas / 2) offset -= totalPersonas;
    while (offset < -totalPersonas / 2) offset += totalPersonas;

    // Posição X baseada no offset
    const x = offset * CARD_SPACING;

    // Profundidade Z - cards laterais vão para trás
    const z = -Math.abs(offset) * 80;

    // Escala - cards laterais são menores
    const scale = 1 - Math.abs(offset) * 0.15;

    // Rotação Y - efeito 3D
    const rotateY = offset * -20;

    // Opacidade - cards muito longe ficam invisíveis
    const opacity = Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.3;

    // Z-index - card central fica na frente
    const zIndex = 10 - Math.abs(Math.round(offset));

    return { x, z, scale, rotateY, opacity, zIndex, offset };
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950 overflow-hidden">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="inline-flex flex-col items-center gap-1 rounded-2xl px-5 py-3 mb-4 bg-green-500/10 border border-green-500/30"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">{roundConfig.emoji}</span>
              <span className="text-base font-bold text-green-400">{roundConfig.label}</span>
            </div>
            <span className="text-xs text-green-300/70">aqui a maioria acerta</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-white mb-2"
          >
            {isDone ? 'Seu desafio é conversar com' : 'Sorteie o perfil da menina'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-zinc-400"
          >
            {isIdle && (
              <span className="flex items-center justify-center gap-2">
                <Hand className="w-4 h-4" />
                Arraste para o lado para girar
              </span>
            )}
            {isDragging && <span className="text-purple-400">Solte para girar...</span>}
            {isSpinning && <span className="text-green-400">Girando! Clique para parar</span>}
            {isStopping && <span className="text-amber-400">Parando...</span>}
          </motion.p>
        </motion.div>

        {/* Roleta 3D */}
        <div
          className={`relative ${isDone ? 'mb-10' : 'mb-6'} ${isDone ? 'h-auto' : 'h-56'}`}
          style={{ perspective: '800px', perspectiveOrigin: 'center center' }}
        >
          <AnimatePresence mode="wait">
            {showCarousel && (
              <motion.div
                key="carousel"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 ${
                  (isIdle || isDragging) ? 'cursor-grab active:cursor-grabbing' : ''
                }`}
                style={{ transformStyle: 'preserve-3d' }}
                onMouseDown={handleDragStart}
                onTouchStart={handleDragStart}
              >
                {/* Cards 3D */}
                {EASY_PERSONAS.map((persona, index) => {
                  const transform = getCardTransform(index);
                  const personaColors = PERSONA_COLORS[index] || PERSONA_COLORS[0];
                  const isCenter = Math.abs(transform.offset) < 0.5;

                  return (
                    <motion.div
                      key={persona.persona.id}
                      className={`absolute left-1/2 top-1/2 w-36 bg-zinc-900 rounded-2xl p-4 border-2 select-none ${
                        isStopped && selectedPersona === persona
                          ? `${personaColors.border} shadow-xl ${personaColors.glow}`
                          : isCenter && !isStopped
                          ? `${personaColors.border} border-opacity-50`
                          : 'border-zinc-700'
                      }`}
                      style={{
                        x: transform.x,
                        y: '-50%',
                        marginLeft: '-72px',
                        zIndex: transform.zIndex,
                        transformStyle: 'preserve-3d',
                      }}
                      animate={{
                        rotateY: transform.rotateY,
                        scale: isStopped && selectedPersona === persona ? 1.15 : transform.scale,
                        opacity: transform.opacity,
                        z: transform.z,
                      }}
                      transition={{
                        type: 'tween',
                        duration: 0.05,
                        ease: 'linear',
                      }}
                    >
                      <div className="flex flex-col items-center pointer-events-none">
                        <div
                          className={`
                            w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg overflow-hidden
                            bg-gradient-to-br ${personaColors.bg}
                          `}
                        >
                          {persona.persona.image ? (
                            <img
                              src={persona.persona.image}
                              alt={persona.persona.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-white">
                              {persona.persona.name[0]}
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-center text-white">
                          {persona.persona.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {persona.persona.age} anos
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {/* Revealing */}
            {isRevealing && selectedPersona && (
              <motion.div
                key="revealing"
                initial={{ opacity: 0, rotateY: 180 }}
                animate={{ opacity: 1, rotateY: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                className={`
                  relative bg-zinc-900 rounded-3xl p-6 border-2
                  ${colors.border} shadow-2xl ${colors.glow}
                `}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <motion.div
                  animate={{ opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-3xl"
                  style={{ boxShadow: '0 0 30px rgba(255,255,255,0.2)' }}
                />
                <div className="flex flex-col items-center relative z-10">
                  <motion.div
                    animate={{ rotate: [0, 8, -8, 0], y: [0, -5, 0] }}
                    transition={{ duration: 0.3, repeat: Infinity }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden bg-gradient-to-br ${colors.bg}`}
                  >
                    {selectedPersona.persona.image ? (
                      <img
                        src={selectedPersona.persona.image}
                        alt={selectedPersona.persona.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {selectedPersona.persona.name[0]}
                      </span>
                    )}
                  </motion.div>
                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="text-lg font-bold text-white"
                  >
                    Revelando...
                  </motion.p>
                </div>
              </motion.div>
            )}

            {/* Done */}
            {isDone && selectedPersona && (
              <motion.div
                key="revealed"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`relative bg-zinc-900 rounded-3xl p-6 border-2 ${colors.border} shadow-2xl ${colors.glow}`}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                  className="absolute -top-3 -right-3"
                >
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                  className="absolute -top-2 -left-2"
                >
                  <Sparkles className="w-6 h-6 text-yellow-400/70" />
                </motion.div>

                <div className="flex flex-col items-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.5 }}
                    className={`w-24 h-24 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden bg-gradient-to-br ${colors.bg}`}
                  >
                    {selectedPersona.persona.image ? (
                      <img
                        src={selectedPersona.persona.image}
                        alt={selectedPersona.persona.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-white">
                        {selectedPersona.persona.name[0]}
                      </span>
                    )}
                  </motion.div>

                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {selectedPersona.persona.name}, {selectedPersona.persona.age}
                    </h2>
                    <p className="text-zinc-400 text-sm mb-3">{selectedPersona.persona.bio}</p>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-zinc-800/50 rounded-xl p-3 mt-4"
                    >
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Contexto</p>
                      <p className="text-sm text-zinc-300">{selectedPersona.persona.context}</p>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Hint */}
        <AnimatePresence>
          {isDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-purple-300">
                <Zap className="w-4 h-4" />
                <span className="text-xs text-center">
                  Mesmo aqui, quem usa o{' '}
                  <span className="font-semibold text-purple-200">Teclado IA Desenrola.ai</span>{' '}
                  responde melhor.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isIdle && (
            <div className="text-center">
              <motion.div
                animate={{ x: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="inline-flex items-center gap-2 text-zinc-500 text-sm"
              >
                <span>←</span>
                <span>Arraste a roleta</span>
                <span>→</span>
              </motion.div>
            </div>
          )}

          {isDragging && (
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 0.3 }}
                className="inline-flex items-center gap-2 text-purple-400 text-sm font-medium"
              >
                Solte para girar!
              </motion.div>
            </div>
          )}

          {isSpinning && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Button
                onClick={handleStop}
                size="xl"
                fullWidth
                className="font-bold text-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg shadow-red-500/30"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="mr-3"
                >
                  <Octagon className="w-6 h-6 fill-white" />
                </motion.div>
                PARAR
              </Button>
            </motion.div>
          )}

          {isStopping && (
            <Button size="xl" fullWidth disabled className="font-bold text-lg opacity-60">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.5, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full mr-2"
              />
              Parando...
            </Button>
          )}

          {isRevealing && (
            <Button size="xl" fullWidth disabled className="font-bold text-lg opacity-40">
              Revelando...
            </Button>
          )}

          {isDone && (
            <motion.div
              className="space-y-3"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Button
                onClick={handleContinue}
                size="xl"
                fullWidth
                className="font-bold text-lg bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 hover:from-purple-500 hover:via-pink-400 hover:to-purple-500 shadow-lg shadow-purple-500/40 hover:shadow-purple-500/60 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.2), 0 4px 15px rgba(0, 0, 0, 0.3)',
                }}
              >
                Conversar com {selectedPersona?.persona.name}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button
                onClick={handleSpinAgain}
                size="lg"
                fullWidth
                className="font-medium text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600 transition-all"
              >
                🎰 Girar roleta novamente
              </Button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
