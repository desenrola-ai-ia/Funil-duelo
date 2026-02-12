'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ChevronLeft, User, Send, Sparkles, MoreVertical, Phone, Video, Search, Paperclip, Mic, Smile, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { FeedbackDisplay } from '@/components/game';
import { useGameStore } from '@/stores';
import { cn } from '@/lib/utils';
import {
  ROUTES,
  UI_TEXTS,
  GAME_CONFIG,
  getRoundConfig,
  getRandomFeedback,
  isWinningTier,
} from '@/constants';
import type { ResponseType, AISuggestion, TierFeedback, ResponseTier, ChatMessage, SuggestionTone } from '@/types';
import { useSoundKit } from '@/hooks/useSoundKit';
import { useHaptics } from '@/hooks/useHaptics';
import { useAnalytics } from '@/hooks/useAnalytics';
import { metaTrackCustom } from '@/lib/metaTrack';

// ============================================
// ROUND PAGE - /duelo/round
// Interface estilo Tinder Chat / Instagram DM / WhatsApp
// ============================================

type GamePhase = 'playing' | 'analyzing' | 'feedback' | 'transition';

const TONES: { id: SuggestionTone; label: string; emoji: string }[] = [
  { id: 'casual',  label: 'Leve',     emoji: '😎' },
  { id: 'flirty',  label: 'Provocar', emoji: '😏' },
  { id: 'funny',   label: 'Humor',    emoji: '😂' },
  { id: 'curious', label: 'Conhecer', emoji: '🤔' },
  { id: 'rescue',  label: 'Resgatar', emoji: '🔄' },
  { id: 'bold',    label: 'Avançar',  emoji: '🎯' },
];

export default function DueloRoundPage() {
  const router = useRouter();
  const { play } = useSoundKit();
  const { tap, success, error, heavy } = useHaptics();
  const { track } = useAnalytics();

  const {
    currentRound,
    playerScore,
    opponentScore,
    rounds,
    isGameOver,
    submitResponse,
    checkPlotTwist,
    getAISuggestions,
    getCurrentPersonaData,
    finalizeGame,
  } = useGameStore();

  const [phase, setPhase] = useState<GamePhase>('playing');
  const [feedback, setFeedback] = useState<TierFeedback | null>(null);
  const [isWin, setIsWin] = useState(false);
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analyzingText, setAnalyzingText] = useState('lendo a vibe…');
  const [showPlotTwist, setShowPlotTwist] = useState(false);
  const [scoreChange, setScoreChange] = useState<{player?: number; opponent?: number} | null>(null);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);
  const [currentTier, setCurrentTier] = useState<ResponseTier | null>(null);
  const [showAlreadyAnswered, setShowAlreadyAnswered] = useState(
    () => rounds[currentRound - 1]?.status === 'completed'
  );

  const personaData = getCurrentPersonaData();
  const currentRoundState = rounds[currentRound - 1];
  const aiSuggestions = getAISuggestions();
  const roundConfig = getRoundConfig(currentRound);

  const isInstagramStyle = currentRound === 2;
  const isWhatsAppStyle = currentRound === 3;

  useEffect(() => {
    if (!personaData) {
      router.replace(ROUTES.LANDING);
    }
  }, [personaData, router]);

  // O useState initializer já detecta round completo no mount (browser back).
  // NÃO usar useEffect aqui — submitResponse marca 'completed' durante o fluxo
  // normal e causaria o modal "já respondeu" ao invés de mostrar o feedback.

  const handleAlreadyAnsweredContinue = () => {
    setShowAlreadyAnswered(false);
    if (isGameOver) {
      router.replace(ROUTES.DUELO_RESULT);
    } else if (currentRound >= GAME_CONFIG.TOTAL_ROUNDS) {
      finalizeGame();
      router.replace(ROUTES.DUELO_RESULT);
    } else if (currentRound === 1) {
      router.replace(ROUTES.ROUND_2);
    } else if (currentRound === 2) {
      router.replace(ROUTES.ROUND_3);
    } else {
      router.replace(ROUTES.DUELO_RESULT);
    }
  };

  const analyzeResponse = async (response: string): Promise<ResponseTier> => {
    if (!personaData) return 'D';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: personaData.persona.name,
          personaAge: personaData.persona.age,
          personaBio: personaData.persona.bio,
          context: personaData.persona.context,
          chatHistory: personaData.chat.map((msg) => ({
            sender: msg.sender,
            content: msg.content,
          })),
          userResponse: response,
          roundNumber: currentRound,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      return data.tier as ResponseTier;
    } catch (error) {
      console.error('Error analyzing response:', error);
      const random = Math.random();
      if (currentRound === 3) {
        if (random < 0.05) return 'B';
        if (random < 0.3) return 'C';
        return 'D';
      } else if (currentRound === 2) {
        if (random < 0.1) return 'B';
        if (random < 0.4) return 'C';
        return 'D';
      } else {
        if (random < 0.2) return 'B';
        if (random < 0.5) return 'C';
        return 'D';
      }
    }
  };

  const handleSubmit = async (
    response: string,
    type: ResponseType,
    suggestion?: AISuggestion
  ) => {
    let tier: ResponseTier;
    let isPlotTwist = false;

    if (type === 'ai_suggestion' && suggestion) {
      track('ai_used', { round: currentRound });
      isPlotTwist = checkPlotTwist();
      
      if (isPlotTwist) {
        track('plot_twist_triggered', { round: currentRound });
        setShowPlotTwist(true);
        setTimeout(() => {
          play('reward', { volumeOverride: 0.55 });
          heavy();
        }, 300);
        tier = 'A';
      } else {
        tier = suggestion.tier;
      }
    } else {
      setPhase('analyzing');
      play('whoosh', { volumeOverride: 0.2 });
      tap();
      
      const texts = ['lendo a vibe…', 'calculando tensão…', 'veredito…'];
      let textIndex = 0;
      setAnalyzingProgress(0);
      setAnalyzingText(texts[0]);
      
      const progressInterval = setInterval(() => {
        setAnalyzingProgress(prev => prev >= 90 ? prev : prev + 15);
        textIndex = (textIndex + 1) % texts.length;
        setAnalyzingText(texts[textIndex]);
      }, 400);
      
      tier = await analyzeResponse(response);
      clearInterval(progressInterval);
      setAnalyzingProgress(100);
    }

    const prevPlayerScore = playerScore;
    const prevOpponentScore = opponentScore;
    submitResponse(response, type, tier);
    
    // Track events
    track('tier_result', { round: currentRound, tier });
    track(`round${currentRound}_complete` as any, {
      round: currentRound,
      tier,
      usedAI: type === 'ai_suggestion',
      responseType: type
    });
    metaTrackCustom('GameRoundComplete', {
      round: currentRound,
      tier,
      usedAI: type === 'ai_suggestion',
    });
    
    setCurrentTier(tier);
    const isWinTier = isWinningTier(tier);
    if (isWinTier) {
      setScoreChange({ player: prevPlayerScore + 1 });
      setTimeout(() => { play('ui-click', { volumeOverride: 0.25 }); tap(); }, 500);
    } else {
      setScoreChange({ opponent: prevOpponentScore + 1 });
      setTimeout(() => { play('ui-click', { volumeOverride: 0.25 }); tap(); }, 500);
    }
    
    setTimeout(() => setScoreChange(null), 1500);

    const tierFeedback = getRandomFeedback(tier);
    setFeedback(tierFeedback);
    setIsWin(isWinTier);
    
    // Track consecutive losses para hint
    if (isWinTier) {
      setConsecutiveLosses(0);
    } else {
      setConsecutiveLosses(prev => prev + 1);
    }
    
    setTimeout(() => {
      setPhase('feedback');
      
      if (tier === 'A') {
        play('win', { volumeOverride: 0.6 });
        success();
      } else if (tier === 'B') {
        play('sparkle', { volumeOverride: 0.45 });
        tap();
      } else if (tier === 'C') {
        play('loss', { volumeOverride: 0.35 });
        tap();
      } else if (tier === 'D') {
        play('loss', { volumeOverride: 0.5 });
        error();
      }
    }, isPlotTwist ? 800 : 200);
    
    if (isPlotTwist) {
      setTimeout(() => setShowPlotTwist(false), 3000);
    }
  };

  const handleNextRound = () => {
    if (currentRound >= GAME_CONFIG.TOTAL_ROUNDS) {
      finalizeGame();
      router.push(ROUTES.DUELO_RESULT);
      return;
    }

    setPhase('transition');
    setTimeout(() => {
      if (currentRound === 1) {
        router.push(ROUTES.ROUND_2);
      } else if (currentRound === 2) {
        router.push(ROUTES.ROUND_3);
      }
    }, 300);
  };

  const getButtonText = () => {
    if (currentRound >= GAME_CONFIG.TOTAL_ROUNDS) {
      return UI_TEXTS.BUTTONS.VIEW_RESULT;
    }
    return UI_TEXTS.BUTTONS.NEXT_ROUND;
  };

  const [response, setResponse] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [showAITutorial, setShowAITutorial] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<AISuggestion[]>([]);
  const [generatedSuggestions, setGeneratedSuggestions] = useState<AISuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<SuggestionTone>('casual');
  const [recommendedTone, setRecommendedTone] = useState<SuggestionTone | null>(null);
  const [responseLength, setResponseLength] = useState<'short' | 'normal'>('normal');
  const [useEmoji, setUseEmoji] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiButtonRef = useRef<HTMLButtonElement>(null);

  // Verifica se a IA foi usada em rounds anteriores
  const usedAIRound1 = rounds[0]?.usedAI ?? false;
  const usedAIRound2 = rounds[1]?.usedAI ?? false;

  // Mensagem do tutorial varia por round
  const tutorialMessage = currentRound === 1
    ? 'Toque aqui para ver respostas prontas geradas pela IA baseadas no perfil e contexto dela.'
    : currentRound === 2
    ? 'Você não usou o Teclado IA no Round 1. Experimenta agora — a dificuldade aumentou.'
    : 'Última chance. Você não usou a IA em nenhum round. Testa antes que acabe.';

  // Tutorial popup: Round 1 sempre, Round 2 se não usou no R1, Round 3 se não usou em nenhum
  useEffect(() => {
    if (phase !== 'playing') return;

    const storageKey = `desenrola_ai_tutorial_r${currentRound}`;
    const seen = sessionStorage.getItem(storageKey);
    if (seen) return;

    // Round 1: sempre mostra
    // Round 2: só se não usou IA no round 1
    // Round 3: só se não usou IA no round 1 NEM no round 2
    const shouldShow =
      currentRound === 1 ||
      (currentRound === 2 && !usedAIRound1) ||
      (currentRound === 3 && !usedAIRound1 && !usedAIRound2);

    if (!shouldShow) return;

    const timer = setTimeout(() => {
      setShowAITutorial(true);
      play('ui-click', { volumeOverride: 0.15 });
    }, 1500);
    return () => clearTimeout(timer);
  }, [currentRound, phase, play, usedAIRound1, usedAIRound2]);

  const dismissTutorial = useCallback(() => {
    setShowAITutorial(false);
    sessionStorage.setItem(`desenrola_ai_tutorial_r${currentRound}`, '1');
  }, [currentRound]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [personaData?.chat]);

  const handleTypedSubmit = () => {
    if (!response.trim()) return;
    handleSubmit(response.trim(), 'typed');
    setResponse('');
  };

  const loadInitialSuggestions = async () => {
    if (!personaData) return;

    setShowSuggestions(true);
    setIsLoadingSuggestions(true);

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: personaData.persona.name,
          personaAge: personaData.persona.age,
          personaBio: personaData.persona.bio,
          context: personaData.persona.context,
          chatHistory: personaData.chat.map((msg) => ({
            sender: msg.sender,
            content: msg.content,
          })),
          roundNumber: currentRound,
          tone: selectedTone,
          length: responseLength,
          useEmoji,
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      if (data.recommendedTone) {
        setRecommendedTone(data.recommendedTone);
        // Auto-select recommended tone on first load
        setSelectedTone(data.recommendedTone);
      }

      if (data.suggestions && data.suggestions.length > 0) {
        setLiveSuggestions(data.suggestions);
      } else {
        setLiveSuggestions(aiSuggestions);
      }
    } catch {
      setLiveSuggestions(aiSuggestions);
    } finally {
      setIsLoadingSuggestions(false);
      setSuggestionsLoaded(true);
    }
  };

  const handleAISelect = (suggestion: AISuggestion) => {
    play('ui-click');
    tap();
    handleSubmit(suggestion.content, 'ai_suggestion', suggestion);
    setShowSuggestions(false);
    setResponse('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTypedSubmit();
    }
  };

  const generateNewSuggestions = async (toneOverride?: SuggestionTone) => {
    if (!personaData || isGenerating) return;

    const tone = toneOverride || selectedTone;
    setIsGenerating(true);
    play('ui-click', { volumeOverride: 0.2 });
    tap();

    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: personaData.persona.name,
          personaAge: personaData.persona.age,
          personaBio: personaData.persona.bio,
          context: personaData.persona.context,
          chatHistory: personaData.chat.map((msg) => ({
            sender: msg.sender,
            content: msg.content,
          })),
          roundNumber: currentRound,
          tone,
          length: responseLength,
          useEmoji,
        }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      if (data.suggestions && data.suggestions.length > 0) {
        // Replace main suggestions when tone changes, otherwise show as "new"
        if (toneOverride) {
          setLiveSuggestions(data.suggestions);
          setGeneratedSuggestions([]);
        } else {
          setGeneratedSuggestions(data.suggestions);
        }
        play('sparkle', { volumeOverride: 0.3 });
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToneChange = (tone: SuggestionTone) => {
    setSelectedTone(tone);
    if (suggestionsLoaded) {
      generateNewSuggestions(tone);
    }
  };

  if (!personaData) {
    return null;
  }

  // ============================================
  // MODAL: Round já respondido
  // ============================================
  if (showAlreadyAnswered) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="w-full max-w-sm"
        >
          <div className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-3xl">✅</span>
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Você já respondeu esse round
            </h2>
            <p className="text-zinc-400 text-sm mb-2">
              Sua resposta no Round {currentRound} já foi registrada.
              {currentRoundState?.usedAI
                ? ' Você usou o Teclado IA.'
                : ' Você respondeu por conta própria.'}
            </p>
            <p className="text-zinc-500 text-xs mb-6">
              Não é possível alterar a resposta depois de enviada.
            </p>

            <Button
              onClick={handleAlreadyAnsweredContinue}
              size="lg"
              fullWidth
              className="font-bold"
            >
              {currentRound >= GAME_CONFIG.TOTAL_ROUNDS || isGameOver
                ? 'Ver resultado final'
                : `Ir para o Round ${currentRound + 1}`}
            </Button>
          </div>
        </motion.div>
      </main>
    );
  }

  // ============================================
  // WHATSAPP STYLE (Round 3) - FUNDO BEGE
  // ============================================
  if (isWhatsAppStyle) {
    return (
      <main className="min-h-screen flex flex-col bg-[#ECE5DD]">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1 h-screen">

          {/* ========== WHATSAPP HEADER ========== */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-20 bg-[#075E54]"
          >
            <div className="flex items-center justify-between px-3 py-2.5">
              <div className="flex items-center gap-3 flex-1">
                <button
                  onClick={() => router.back()}
                  className="p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>

                <div className="flex items-center gap-3 flex-1">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300">
                      {personaData.persona.image ? (
                        <img
                          src={personaData.persona.image}
                          alt={personaData.persona.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="font-medium text-white text-base leading-tight">
                      {personaData.persona.name}
                    </h1>
                    <p className="text-white/80 text-xs leading-tight">online</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <Video className="w-5 h-5 text-white" />
                <Phone className="w-5 h-5 text-white" />
                <MoreVertical className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pb-2 text-xs bg-[#075E54]/50">
              <span className="text-white/90">Round {currentRound}/{GAME_CONFIG.TOTAL_ROUNDS}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold">{playerScore}</span>
                <span className="text-white/70">x</span>
                <span className="text-white font-bold">{opponentScore}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white">
                {roundConfig.emoji} {roundConfig.label}
              </span>
            </div>
          </motion.header>

          {/* ========== MAIN CONTENT ========== */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ANALYZING PHASE */}
              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 justify-center items-center px-4 bg-[#ECE5DD]"
                >
                  <div className="bg-white rounded-2xl p-8 text-center shadow-lg">
                    <Loader2 className="w-12 h-12 text-[#075E54] animate-spin mx-auto mb-4" />
                    <p className="text-gray-900 text-lg font-medium">Analisando sua resposta...</p>
                    <p className="text-gray-500 text-sm mt-2">A IA está avaliando seu papo</p>
                  </div>
                </motion.div>
              )}

              {/* PLAYING PHASE - WHATSAPP STYLE */}
              {phase === 'playing' && (
                <motion.div
                  key={`playing-${currentRound}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Chat messages area - FUNDO BEGE WHATSAPP */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 bg-[#ECE5DD]">
                    
                    {/* Context label */}
                    <div className="flex justify-center mb-4">
                      <div className="bg-white/90 rounded-lg px-3 py-1.5 shadow-sm">
                        <p className="text-gray-600 text-xs text-center">
                          {personaData.persona.context}
                        </p>
                      </div>
                    </div>

                    {/* Messages */}
                    {personaData.chat.map((message: ChatMessage, index: number) => {
                      const isUser = message.sender === 'user';
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn('flex flex-col mb-2', isUser ? 'items-end' : 'items-start')}
                        >
                          <div
                            className={cn(
                              'max-w-[80%] px-3 py-2 shadow-sm relative',
                              isUser
                                ? 'bg-[#DCF8C6] rounded-lg rounded-tr-none'
                                : 'bg-white rounded-lg rounded-tl-none'
                            )}
                          >
                            <p className={cn(
                              'text-sm leading-relaxed',
                              isUser ? 'text-gray-900' : 'text-gray-900'
                            )}>
                              {message.content}
                            </p>
                            <span className={cn(
                              'text-[10px] ml-1 inline-block mt-0.5',
                              isUser ? 'text-gray-600' : 'text-gray-500'
                            )}>
                              {message.time || '20:15'}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* ========== INPUT AREA - WHATSAPP STYLE ========== */}
                  <div className="bg-[#F0F0F0]">
                    {/* AI Suggestions expandable */}
                    <AnimatePresence>
                      {/* Hint após 2 losses */}
                      {consecutiveLosses >= 2 && !showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mx-4 mt-3 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3"
                        >
                          <p className="text-sm text-purple-300 text-center">
                            💜 Quer uma resposta forte pronta? (1 toque)
                          </p>
                        </motion.div>
                      )}

                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-b border-gray-300"
                        >
                          <div className="p-4 space-y-2 bg-white">
                            {isLoadingSuggestions ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-8"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mb-4"
                                >
                                  <Sparkles className="w-8 h-8 text-[#075E54]" />
                                </motion.div>
                                <motion.p
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="text-[#075E54] font-medium text-sm"
                                >
                                  Analisando contexto e perfil...
                                </motion.p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Gerando as melhores respostas
                                </p>
                              </motion.div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-4 h-4 text-[#075E54]" />
                                  <span className="text-sm font-medium text-[#075E54]">
                                    Teclado Desenrola AI
                                  </span>
                                </div>

                                {/* Recommended tone */}
                                {recommendedTone && recommendedTone !== selectedTone && (
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-xs text-[#075E54]">★</span>
                                    <span className="text-xs text-gray-500">
                                      Recomendado:{' '}
                                      <button onClick={() => handleToneChange(recommendedTone)} className="text-[#075E54] font-medium">
                                        {TONES.find(t => t.id === recommendedTone)?.emoji} {TONES.find(t => t.id === recommendedTone)?.label}
                                      </button>
                                    </span>
                                  </div>
                                )}

                                {/* Tone chips */}
                                <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                  {TONES.map((tone) => (
                                    <button
                                      key={tone.id}
                                      onClick={() => handleToneChange(tone.id)}
                                      className={cn(
                                        'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0',
                                        selectedTone === tone.id
                                          ? 'bg-[#075E54] text-white border-[#075E54]'
                                          : 'bg-[#075E54]/10 border-[#075E54]/30 text-[#075E54] hover:bg-[#075E54]/20'
                                      )}
                                    >
                                      <span>{tone.emoji}</span>
                                      <span>{tone.label}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Length + Emoji toggles */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                                    <button
                                      onClick={() => { setResponseLength('short'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                      className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'short' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                    >
                                      Curta
                                    </button>
                                    <button
                                      onClick={() => { setResponseLength('normal'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                      className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'normal' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                    >
                                      Normal
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => { setUseEmoji(!useEmoji); if (suggestionsLoaded) generateNewSuggestions(); }}
                                    className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all', useEmoji ? 'text-gray-600' : 'text-gray-400 bg-gray-100')}
                                  >
                                    <span>{useEmoji ? '😀' : '🚫'}</span>
                                    <span>Emoji</span>
                                  </button>
                                </div>

                                {isGenerating && (
                                  <div className="flex items-center justify-center gap-2 py-3">
                                    <Sparkles className="w-4 h-4 text-[#075E54] animate-spin" />
                                    <span className="text-sm text-[#075E54]">Gerando...</span>
                                  </div>
                                )}

                                {!isGenerating && liveSuggestions.map((suggestion, index) => (
                                  <motion.button
                                    key={suggestion.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleAISelect(suggestion)}
                                    className={cn(
                                      'w-full text-left p-3 rounded-xl border transition-all',
                                      'bg-[#DCF8C6] border-[#075E54]/20',
                                      'hover:border-[#075E54]/50 hover:bg-[#D0F4B8]',
                                      'active:scale-[0.98]'
                                    )}
                                  >
                                    <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                  </motion.button>
                                ))}

                                {/* Generated AI suggestions */}
                                {generatedSuggestions.length > 0 && (
                                  <>
                                    <div className="flex items-center gap-2 mt-4 mb-2">
                                      <RefreshCw className="w-3.5 h-3.5 text-[#075E54]" />
                                      <span className="text-xs font-medium text-[#075E54]">
                                        Novas sugestões da IA
                                      </span>
                                    </div>
                                    {generatedSuggestions.map((suggestion, index) => (
                                      <motion.button
                                        key={suggestion.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleAISelect(suggestion)}
                                        className={cn(
                                          'w-full text-left p-3 rounded-xl border transition-all',
                                          'bg-[#c8f0b0] border-[#075E54]/30',
                                          'hover:border-[#075E54]/60 hover:bg-[#b8e8a0]',
                                          'active:scale-[0.98]'
                                        )}
                                      >
                                        <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                      </motion.button>
                                    ))}
                                  </>
                                )}

                                {/* Generate new suggestions button */}
                                {!isGenerating && (
                                  <button
                                    onClick={() => generateNewSuggestions()}
                                    disabled={isGenerating}
                                    className={cn(
                                      'w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border border-dashed transition-all',
                                      'border-[#075E54]/30 text-[#075E54]',
                                      'hover:border-[#075E54]/60 hover:bg-[#DCF8C6]/50',
                                      'active:scale-[0.98] disabled:opacity-50'
                                    )}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-sm font-medium">Gerar novas respostas</span>
                                  </button>
                                )}

                                <p className="text-[#075E54] text-xs text-center pt-1">
                                  Respostas geradas pela IA baseadas no contexto
                                </p>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input row - WhatsApp style */}
                    <div className="flex items-center gap-2 px-2 py-2">
                      {/* AI toggle + Tutorial popup */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            dismissTutorial();
                            if (!showSuggestions && !suggestionsLoaded) {
                              loadInitialSuggestions();
                            } else {
                              setShowSuggestions(!showSuggestions);
                            }
                          }}
                          disabled={currentRoundState?.status === 'completed'}
                          className={cn(
                            'relative z-10 p-2.5 rounded-full transition-all',
                            showSuggestions
                              ? 'bg-[#075E54] text-white'
                              : 'bg-white text-[#075E54] hover:bg-gray-100',
                            showAITutorial && !showSuggestions && 'ring-2 ring-[#075E54] ring-offset-2 ring-offset-[#F0F0F0]',
                            'disabled:opacity-50'
                          )}
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>

                        {/* Tutorial popup - WhatsApp theme */}
                        <AnimatePresence>
                          {showAITutorial && !showSuggestions && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="absolute bottom-full left-0 mb-3 z-50"
                            >
                              <div className="relative bg-[#075E54] rounded-2xl px-4 py-3 shadow-xl shadow-[#075E54]/30 w-[260px]">
                                <div className="absolute -bottom-2 left-5 w-4 h-4 bg-[#075E54] rotate-45" />
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-white" />
                                      <span className="text-white font-bold text-sm">Teclado IA</span>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
                                      className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5 text-white/70" />
                                    </button>
                                  </div>
                                  <p className="text-white/90 text-xs leading-relaxed">
                                    {tutorialMessage}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Text input - WhatsApp style */}
                      <div className="flex-1 flex items-center bg-white rounded-full pl-4 pr-2 py-2">
                        <Smile className="w-5 h-5 text-gray-400 mr-2" />
                        <input
                          type="text"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Mensagem"
                          disabled={currentRoundState?.status === 'completed'}
                          className={cn(
                            'flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm',
                            'focus:outline-none',
                            'disabled:opacity-50'
                          )}
                        />
                        <Paperclip className="w-5 h-5 text-gray-400 ml-2" />
                      </div>

                      {/* Send/Mic button */}
                      <button
                        onClick={response.trim() ? handleTypedSubmit : undefined}
                        disabled={currentRoundState?.status === 'completed'}
                        className="bg-[#075E54] p-3 rounded-full transition-all hover:bg-[#064f47] active:scale-95 disabled:opacity-50"
                      >
                        {response.trim() ? (
                          <Send className="w-5 h-5 text-white" />
                        ) : (
                          <Mic className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FEEDBACK PHASE */}
              {phase === 'feedback' && feedback && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col flex-1 justify-center px-4 bg-[#ECE5DD]"
                >
                  <FeedbackDisplay feedback={feedback} isWin={isWin} tier={currentTier} className="mb-8" />
                  <Button
                    onClick={handleNextRound}
                    size="xl"
                    fullWidth
                    className="font-bold bg-[#075E54] hover:bg-[#064f47]"
                  >
                    {getButtonText()}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // INSTAGRAM DM STYLE (Round 2) - FUNDO BRANCO
  // ============================================
  // ============================================
  // INSTAGRAM DM STYLE (Round 2) - FUNDO BRANCO
  // ============================================
  if (isInstagramStyle) {
    return (
      <main className="min-h-screen flex flex-col bg-white">
        <div className="w-full max-w-md mx-auto flex flex-col flex-1 h-screen">

          {/* ========== INSTAGRAM HEADER ========== */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky top-0 z-20 bg-white border-b border-gray-200"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.back()}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-900" />
                </button>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full p-[2px] bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600">
                      <div className="w-full h-full rounded-full bg-white p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden">
                          {personaData.persona.image ? (
                            <img
                              src={personaData.persona.image}
                              alt={personaData.persona.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-500" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <h1 className="font-semibold text-gray-900 text-sm">
                      {personaData.persona.name.toLowerCase().replace(' ', '_')}
                    </h1>
                    <p className="text-gray-500 text-xs">Ativo(a) agora</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Phone className="w-5 h-5 text-gray-900" />
                <Video className="w-5 h-5 text-gray-900" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 pb-2 text-xs">
              <span className="text-gray-500">Round {currentRound}/{GAME_CONFIG.TOTAL_ROUNDS}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-bold">{playerScore}</span>
                <span className="text-gray-400">x</span>
                <span className="text-gray-900 font-bold">{opponentScore}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                {roundConfig.emoji} {roundConfig.label}
              </span>
            </div>
          </motion.header>

          {/* ========== MAIN CONTENT ========== */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              {/* ANALYZING PHASE */}
              {phase === 'analyzing' && (
                <motion.div
                  key="analyzing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 justify-center items-center px-4 bg-white"
                >
                  <div className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-200">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-900 text-lg font-medium">Analisando sua resposta...</p>
                    <p className="text-gray-500 text-sm mt-2">A IA está avaliando seu papo</p>
                  </div>
                </motion.div>
              )}

              {/* PLAYING PHASE - INSTAGRAM DM STYLE */}
              {phase === 'playing' && (
                <motion.div
                  key={`playing-${currentRound}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col flex-1 min-h-0"
                >
                  {/* Chat messages area - FUNDO BRANCO */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 bg-white">
                    
                    {/* Story Reply Block - Instagram Style */}
                    {personaData.persona.storyImage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-end mb-4"
                      >
                        {/* "Você respondeu ao story" label */}
                        <span className="text-xs text-gray-400 mb-2 mr-1">
                          Você respondeu ao story
                        </span>
                        
                        {/* Story thumbnail - box separado redondinho */}
                        <div className="max-w-[200px] mb-2">
                          <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                            <img
                              src={personaData.persona.storyImage}
                              alt="Story"
                              className="w-full h-auto object-cover"
                            />
                          </div>
                        </div>
                        
                        {/* User's message - separado, fundo azul/roxo Instagram */}
                        <div className="max-w-[75%]">
                          <div className="bg-[#D946EF] text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                            {personaData.chat[0]?.content}
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1 px-1 block text-right">
                            {personaData.chat[0]?.time || 'Agora'}
                          </span>
                        </div>
                      </motion.div>
                    )}

                    {/* Her response - fundo branco acinzentado */}
                    {personaData.chat.slice(1).map((message: ChatMessage, index: number) => {
                      const isUser = message.sender === 'user';
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          className={cn('flex flex-col mb-3', isUser ? 'items-end' : 'items-start')}
                        >
                          <div className="flex items-end gap-2">
                            {!isUser && (
                              <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                                {personaData.persona.image ? (
                                  <img
                                    src={personaData.persona.image}
                                    alt={personaData.persona.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-500" />
                                  </div>
                                )}
                              </div>
                            )}
                            <div
                              className={cn(
                                'max-w-[70%] px-4 py-2.5 text-sm',
                                isUser
                                  ? 'bg-[#D946EF] text-white rounded-2xl rounded-br-md'
                                  : 'bg-[#EFEFEF] text-gray-900 rounded-2xl rounded-bl-md',
                                
                              )}
                            >
                              {message.content}
                            </div>
                          </div>
                          {message.time && (
                            <span className={cn(
                              "text-[10px] text-gray-400 mt-1",
                              isUser ? "pr-1" : "pl-9"
                            )}>
                              {message.time}
                            </span>
                          )}
                        </motion.div>
                      );
                    })}
                    <div ref={chatEndRef} />
                  </div>

                  {/* ========== INPUT AREA - INSTAGRAM STYLE ========== */}
                  <div className="border-t border-gray-200 bg-white">
                    {/* AI Suggestions expandable */}
                    <AnimatePresence>
                                    {/* Hint após 2 losses */}
                                    {consecutiveLosses >= 2 && !showSuggestions && (
                                      <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-3 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3"
                                      >
                                        <p className="text-sm text-purple-300 text-center">
                                          💜 Quer uma resposta forte pronta? (1 toque)
                                        </p>
                                      </motion.div>
                                    )}


                      {showSuggestions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden border-b border-gray-200"
                        >
                          <div className="p-4 space-y-2 bg-gradient-to-b from-purple-50 to-white">
                            {isLoadingSuggestions ? (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-8"
                              >
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="mb-4"
                                >
                                  <Sparkles className="w-8 h-8 text-purple-600" />
                                </motion.div>
                                <motion.p
                                  animate={{ opacity: [0.5, 1, 0.5] }}
                                  transition={{ duration: 1.5, repeat: Infinity }}
                                  className="text-purple-600 font-medium text-sm"
                                >
                                  Analisando contexto e perfil...
                                </motion.p>
                                <p className="text-purple-400 text-xs mt-1">
                                  Gerando as melhores respostas
                                </p>
                              </motion.div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <Sparkles className="w-4 h-4 text-purple-600" />
                                  <span className="text-sm font-medium text-purple-600">
                                    Teclado Desenrola AI
                                  </span>
                                </div>

                                {/* Recommended tone */}
                                {recommendedTone && recommendedTone !== selectedTone && (
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <span className="text-xs text-purple-600">★</span>
                                    <span className="text-xs text-gray-500">
                                      Recomendado:{' '}
                                      <button onClick={() => handleToneChange(recommendedTone)} className="text-purple-600 font-medium">
                                        {TONES.find(t => t.id === recommendedTone)?.emoji} {TONES.find(t => t.id === recommendedTone)?.label}
                                      </button>
                                    </span>
                                  </div>
                                )}

                                {/* Tone chips */}
                                <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                  {TONES.map((tone) => (
                                    <button
                                      key={tone.id}
                                      onClick={() => handleToneChange(tone.id)}
                                      className={cn(
                                        'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0',
                                        selectedTone === tone.id
                                          ? 'bg-purple-600 text-white border-purple-600'
                                          : 'bg-purple-100 border-purple-300 text-purple-600 hover:bg-purple-200'
                                      )}
                                    >
                                      <span>{tone.emoji}</span>
                                      <span>{tone.label}</span>
                                    </button>
                                  ))}
                                </div>

                                {/* Length + Emoji toggles */}
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                                    <button
                                      onClick={() => { setResponseLength('short'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                      className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'short' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                    >
                                      Curta
                                    </button>
                                    <button
                                      onClick={() => { setResponseLength('normal'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                      className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'normal' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                    >
                                      Normal
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => { setUseEmoji(!useEmoji); if (suggestionsLoaded) generateNewSuggestions(); }}
                                    className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all', useEmoji ? 'text-gray-600' : 'text-gray-400 bg-gray-100')}
                                  >
                                    <span>{useEmoji ? '😀' : '🚫'}</span>
                                    <span>Emoji</span>
                                  </button>
                                </div>

                                {isGenerating && (
                                  <div className="flex items-center justify-center gap-2 py-3">
                                    <Sparkles className="w-4 h-4 text-purple-600 animate-spin" />
                                    <span className="text-sm text-purple-600">Gerando...</span>
                                  </div>
                                )}

                                {!isGenerating && liveSuggestions.map((suggestion, index) => (
                                  <motion.button
                                    key={suggestion.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleAISelect(suggestion)}
                                    className={cn(
                                      'w-full text-left p-3 rounded-xl border transition-all',
                                      'bg-white border-purple-200 shadow-sm',
                                      'hover:border-purple-400 hover:bg-purple-50',
                                      'active:scale-[0.98]'
                                    )}
                                  >
                                    <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                  </motion.button>
                                ))}

                                {/* Generated AI suggestions */}
                                {generatedSuggestions.length > 0 && (
                                  <>
                                    <div className="flex items-center gap-2 mt-4 mb-2">
                                      <RefreshCw className="w-3.5 h-3.5 text-purple-600" />
                                      <span className="text-xs font-medium text-purple-600">
                                        Novas sugestões da IA
                                      </span>
                                    </div>
                                    {generatedSuggestions.map((suggestion, index) => (
                                      <motion.button
                                        key={suggestion.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => handleAISelect(suggestion)}
                                        className={cn(
                                          'w-full text-left p-3 rounded-xl border transition-all',
                                          'bg-purple-50 border-purple-300 shadow-sm',
                                          'hover:border-purple-500 hover:bg-purple-100',
                                          'active:scale-[0.98]'
                                        )}
                                      >
                                        <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                      </motion.button>
                                    ))}
                                  </>
                                )}

                                {/* Generate new suggestions button */}
                                {!isGenerating && (
                                  <button
                                    onClick={() => generateNewSuggestions()}
                                    disabled={isGenerating}
                                    className={cn(
                                      'w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border border-dashed transition-all',
                                      'border-purple-300 text-purple-600',
                                      'hover:border-purple-500 hover:bg-purple-50',
                                      'active:scale-[0.98] disabled:opacity-50'
                                    )}
                                  >
                                    <RefreshCw className="w-4 h-4" />
                                    <span className="text-sm font-medium">Gerar novas respostas</span>
                                  </button>
                                )}

                                <p className="text-purple-500 text-xs text-center pt-1">
                                  Respostas geradas pela IA baseadas no contexto
                                </p>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Input row - Instagram style */}
                    <div className="flex items-center gap-2 p-3">
                      {/* AI toggle + Tutorial popup */}
                      <div className="relative">
                        <button
                          onClick={() => {
                            dismissTutorial();
                            if (!showSuggestions && !suggestionsLoaded) {
                              loadInitialSuggestions();
                            } else {
                              setShowSuggestions(!showSuggestions);
                            }
                          }}
                          disabled={currentRoundState?.status === 'completed'}
                          className={cn(
                            'relative z-10 p-2.5 rounded-full transition-all',
                            showSuggestions
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-gray-100 text-purple-600 hover:bg-gray-200',
                            showAITutorial && !showSuggestions && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white',
                            'disabled:opacity-50'
                          )}
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>

                        {/* Tutorial popup - Instagram theme */}
                        <AnimatePresence>
                          {showAITutorial && !showSuggestions && (
                            <motion.div
                              initial={{ opacity: 0, y: 10, scale: 0.9 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: 5, scale: 0.95 }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="absolute bottom-full left-0 mb-3 z-50"
                            >
                              <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-4 py-3 shadow-xl shadow-purple-500/30 w-[260px]">
                                <div className="absolute -bottom-2 left-5 w-4 h-4 bg-purple-600 rotate-45" />
                                <div className="relative z-10">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                      <Sparkles className="w-4 h-4 text-white" />
                                      <span className="text-white font-bold text-sm">Teclado IA</span>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
                                      className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5 text-white/70" />
                                    </button>
                                  </div>
                                  <p className="text-white/90 text-xs leading-relaxed">
                                    {tutorialMessage}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Text input - Instagram style */}
                      <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2 border border-gray-200">
                        <input
                          type="text"
                          value={response}
                          onChange={(e) => setResponse(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Enviar mensagem..."
                          disabled={currentRoundState?.status === 'completed'}
                          className={cn(
                            'flex-1 bg-transparent text-gray-900 placeholder-gray-500 text-sm',
                            'focus:outline-none',
                            'disabled:opacity-50'
                          )}
                        />
                      </div>

                      {/* Send button */}
                      {response.trim() ? (
                        <button
                          onClick={handleTypedSubmit}
                          disabled={currentRoundState?.status === 'completed'}
                          className="text-[#3797F0] font-semibold text-sm hover:text-[#1877F2] transition-colors disabled:opacity-50"
                        >
                          Enviar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* FEEDBACK PHASE */}
              {phase === 'feedback' && feedback && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col flex-1 justify-center px-4 bg-gradient-to-b from-purple-50 to-white"
                >
                  <FeedbackDisplay feedback={feedback} isWin={isWin} tier={currentTier} className="mb-8" />
                  <Button
                    onClick={handleNextRound}
                    size="xl"
                    fullWidth
                    className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  >
                    {getButtonText()}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    );
  }

  // ============================================
  // TINDER STYLE (Round 1 and 3)
  // ============================================
  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 h-screen">

        {/* ========== HEADER ESTILO TINDER ========== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-0 z-20 bg-gradient-to-r from-[#FD297B] via-[#FF655B] to-[#FF7854] shadow-lg"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>

            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {personaData.persona.image ? (
                    <img
                      src={personaData.persona.image}
                      alt={personaData.persona.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
              </div>
              <div className="text-center">
                <h1 className="font-semibold text-white text-base drop-shadow-sm">
                  {personaData.persona.name}
                </h1>
                <p className="text-white/90 text-xs drop-shadow-sm">
                  {personaData.persona.age} anos
                </p>
              </div>
            </div>

            <button className="p-2 -mr-2 hover:bg-white/20 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-4 pb-2 text-xs">
            <span className="text-white/90 drop-shadow-sm">Round {currentRound}/{GAME_CONFIG.TOTAL_ROUNDS}</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold drop-shadow-sm">{playerScore}</span>
              <span className="text-white/70">x</span>
              <span className="text-white font-bold drop-shadow-sm">{opponentScore}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/20 text-white backdrop-blur-sm">
              {roundConfig.emoji} {roundConfig.label}
            </span>
          </div>
        </motion.header>

        {/* ========== MAIN CONTENT ========== */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* ANALYZING PHASE */}
            {phase === 'analyzing' && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1 justify-center items-center px-4 bg-gradient-to-b from-purple-50 to-pink-50"
              >
                <div className="bg-white rounded-2xl p-8 text-center shadow-xl border border-purple-100">
                  <Loader2 className="w-12 h-12 text-pink-500 animate-spin mx-auto mb-4" />
                  <p className="text-gray-800 text-lg font-medium">Analisando sua resposta...</p>
                  <p className="text-gray-600 text-sm mt-2">A IA está avaliando seu papo</p>
                </div>
              </motion.div>
            )}

            {/* PLAYING PHASE - TINDER STYLE */}
            {phase === 'playing' && (
              <motion.div
                key={`playing-${currentRound}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="px-4 py-2 bg-gradient-to-r from-pink-50 to-orange-50 border-b border-pink-100">
                  <p className="text-pink-600 text-xs text-center italic font-medium">
                    {personaData.persona.context}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-white">
                  {personaData.chat.map((message: ChatMessage, index: number) => {
                    const isUser = message.sender === 'user';
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}
                      >
                        <div
                          className={cn(
                            'max-w-[75%] px-4 py-2.5 text-sm',
                            isUser
                              ? 'bg-zinc-200 text-zinc-900 rounded-2xl rounded-br-md'
                              : 'bg-gradient-to-r from-[#FF6B6B] to-[#FD267A] text-white rounded-2xl rounded-bl-md',
                            message.isLastMessage && !isUser && 'ring-2 ring-yellow-500/50'
                          )}
                        >
                          {message.content}
                        </div>
                        {message.time && (
                          <span className="text-[10px] text-zinc-600 mt-1 px-1">
                            {message.time}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>

                {/* ========== INPUT AREA ========== */}
                <div className="border-t border-gray-200 bg-white shadow-lg">
                  <AnimatePresence>
                                  {/* Hint após 2 losses */}
                                  {consecutiveLosses >= 2 && !showSuggestions && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="mb-3 bg-purple-500/10 border border-purple-500/30 rounded-xl p-3"
                                    >
                                      <p className="text-sm text-purple-300 text-center">
                                        💜 Quer uma resposta forte pronta? (1 toque)
                                      </p>
                                    </motion.div>
                                  )}


                    {showSuggestions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-b border-gray-200"
                      >
                        <div className="p-4 space-y-2 bg-gradient-to-b from-purple-50 to-pink-50">
                          {isLoadingSuggestions ? (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex flex-col items-center justify-center py-8"
                            >
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="mb-4"
                              >
                                <Sparkles className="w-8 h-8 text-purple-600" />
                              </motion.div>
                              <motion.p
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="text-purple-600 font-medium text-sm"
                              >
                                Analisando contexto e perfil...
                              </motion.p>
                              <p className="text-purple-400 text-xs mt-1">
                                Gerando as melhores respostas
                              </p>
                            </motion.div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-600">
                                  Teclado Desenrola AI
                                </span>
                              </div>

                              {/* Recommended tone */}
                              {recommendedTone && recommendedTone !== selectedTone && (
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className="text-xs text-pink-600">★</span>
                                  <span className="text-xs text-gray-500">
                                    Recomendado:{' '}
                                    <button onClick={() => handleToneChange(recommendedTone)} className="text-pink-600 font-medium">
                                      {TONES.find(t => t.id === recommendedTone)?.emoji} {TONES.find(t => t.id === recommendedTone)?.label}
                                    </button>
                                  </span>
                                </div>
                              )}

                              {/* Tone chips */}
                              <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                {TONES.map((tone) => (
                                  <button
                                    key={tone.id}
                                    onClick={() => handleToneChange(tone.id)}
                                    className={cn(
                                      'flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all shrink-0',
                                      selectedTone === tone.id
                                        ? 'bg-pink-600 text-white border-pink-600'
                                        : 'bg-pink-100 border-pink-300 text-pink-600 hover:bg-pink-200'
                                    )}
                                  >
                                    <span>{tone.emoji}</span>
                                    <span>{tone.label}</span>
                                  </button>
                                ))}
                              </div>

                              {/* Length + Emoji toggles */}
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                                  <button
                                    onClick={() => { setResponseLength('short'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                    className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'short' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                  >
                                    Curta
                                  </button>
                                  <button
                                    onClick={() => { setResponseLength('normal'); if (suggestionsLoaded) generateNewSuggestions(); }}
                                    className={cn('px-2 py-1 rounded-md text-xs transition-all', responseLength === 'normal' ? 'bg-white shadow-sm text-gray-800 font-medium' : 'text-gray-500')}
                                  >
                                    Normal
                                  </button>
                                </div>
                                <button
                                  onClick={() => { setUseEmoji(!useEmoji); if (suggestionsLoaded) generateNewSuggestions(); }}
                                  className={cn('flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all', useEmoji ? 'text-gray-600' : 'text-gray-400 bg-gray-100')}
                                >
                                  <span>{useEmoji ? '😀' : '🚫'}</span>
                                  <span>Emoji</span>
                                </button>
                              </div>

                              {isGenerating && (
                                <div className="flex items-center justify-center gap-2 py-3">
                                  <Sparkles className="w-4 h-4 text-pink-600 animate-spin" />
                                  <span className="text-sm text-pink-600">Gerando...</span>
                                </div>
                              )}

                              {!isGenerating && liveSuggestions.map((suggestion, index) => (
                                <motion.button
                                  key={suggestion.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  onClick={() => handleAISelect(suggestion)}
                                  className={cn(
                                    'w-full text-left p-3 rounded-xl border transition-all',
                                    'bg-white border-purple-200 shadow-sm',
                                    'hover:border-purple-400 hover:bg-purple-50',
                                    'active:scale-[0.98]'
                                  )}
                                >
                                  <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                </motion.button>
                              ))}

                              {/* Generated AI suggestions */}
                              {generatedSuggestions.length > 0 && (
                                <>
                                  <div className="flex items-center gap-2 mt-4 mb-2">
                                    <RefreshCw className="w-3.5 h-3.5 text-pink-600" />
                                    <span className="text-xs font-medium text-pink-600">
                                      Novas sugestões da IA
                                    </span>
                                  </div>
                                  {generatedSuggestions.map((suggestion, index) => (
                                    <motion.button
                                      key={suggestion.id}
                                      initial={{ opacity: 0, x: -20 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: index * 0.1 }}
                                      onClick={() => handleAISelect(suggestion)}
                                      className={cn(
                                        'w-full text-left p-3 rounded-xl border transition-all',
                                        'bg-pink-50 border-pink-300 shadow-sm',
                                        'hover:border-pink-500 hover:bg-pink-100',
                                        'active:scale-[0.98]'
                                      )}
                                    >
                                      <p className="text-gray-800 text-sm">{suggestion.content}</p>
                                    </motion.button>
                                  ))}
                                </>
                              )}

                              {/* Generate new suggestions button */}
                              {!isGenerating && (
                                <button
                                  onClick={() => generateNewSuggestions()}
                                  disabled={isGenerating}
                                  className={cn(
                                    'w-full flex items-center justify-center gap-2 py-2.5 mt-2 rounded-xl border border-dashed transition-all',
                                    'border-pink-300 text-pink-600',
                                    'hover:border-pink-500 hover:bg-pink-50',
                                    'active:scale-[0.98] disabled:opacity-50'
                                  )}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                  <span className="text-sm font-medium">Gerar novas respostas</span>
                                </button>
                              )}

                              <p className="text-purple-600 text-xs text-center pt-1">
                                Respostas geradas pela IA baseadas no contexto
                              </p>
                            </>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-end gap-2 p-3">
                    {/* Botão Teclado IA + Tutorial tooltip */}
                    <div className="relative">
                      <button
                        ref={aiButtonRef}
                        onClick={() => {
                          dismissTutorial();
                          if (!showSuggestions && !suggestionsLoaded) {
                            loadInitialSuggestions();
                          } else {
                            setShowSuggestions(!showSuggestions);
                          }
                        }}
                        disabled={currentRoundState?.status === 'completed'}
                        className={cn(
                          'relative z-10 p-3 rounded-full transition-all',
                          showSuggestions
                            ? 'bg-gradient-to-r from-[#FD297B] to-[#FF655B] text-white shadow-md'
                            : 'bg-gray-100 text-purple-600 hover:bg-gray-200',
                          showAITutorial && !showSuggestions && 'ring-2 ring-purple-500 ring-offset-2 ring-offset-white',
                          'disabled:opacity-50'
                        )}
                      >
                        <Sparkles className="w-5 h-5" />
                      </button>

                      {/* Tutorial popup */}
                      <AnimatePresence>
                        {showAITutorial && !showSuggestions && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="absolute bottom-full left-0 mb-3 z-50"
                          >
                            <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl px-4 py-3 shadow-xl shadow-purple-500/30 w-[260px]">
                              {/* Seta apontando para baixo */}
                              <div className="absolute -bottom-2 left-5 w-4 h-4 bg-purple-600 rotate-45" />

                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-white" />
                                    <span className="text-white font-bold text-sm">Teclado IA</span>
                                  </div>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); dismissTutorial(); }}
                                    className="p-0.5 hover:bg-white/20 rounded-full transition-colors"
                                  >
                                    <X className="w-3.5 h-3.5 text-white/70" />
                                  </button>
                                </div>
                                <p className="text-white/90 text-xs leading-relaxed">
                                  Toque aqui para ver respostas prontas geradas pela IA baseadas no perfil e contexto dela.
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex-1 flex items-end gap-2 bg-gray-100 rounded-2xl px-4 py-2 border border-gray-200">
                      <input
                        type="text"
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Digite sua mensagem..."
                        disabled={currentRoundState?.status === 'completed'}
                        className={cn(
                          'flex-1 bg-transparent text-gray-800 placeholder-gray-500 text-sm py-1',
                          'focus:outline-none',
                          'disabled:opacity-50'
                        )}
                      />
                    </div>

                    <button
                      onClick={handleTypedSubmit}
                      disabled={currentRoundState?.status === 'completed' || !response.trim()}
                      className={cn(
                        'p-3 rounded-full transition-all',
                        response.trim()
                          ? 'bg-gradient-to-r from-[#FD297B] to-[#FF655B] text-white shadow-md'
                          : 'bg-gray-200 text-gray-400',
                        'disabled:opacity-50 active:scale-95'
                      )}
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* FEEDBACK PHASE */}
            {phase === 'feedback' && feedback && (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col flex-1 justify-center px-4 bg-gradient-to-b from-purple-50 to-pink-50"
              >
                <FeedbackDisplay feedback={feedback} isWin={isWin} tier={currentTier} className="mb-8" />
                <Button
                  onClick={handleNextRound}
                  size="xl"
                  fullWidth
                  className="font-bold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  {getButtonText()}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
