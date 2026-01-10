import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina classes CSS com suporte a Tailwind
 * Usa clsx para condicional classes e tailwind-merge para resolver conflitos
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata numero com leading zero
 */
export function formatScore(score: number): string {
  return score.toString().padStart(1, '0');
}

/**
 * Gera ID unico simples
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Delay helper para animacoes
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Clamp valor entre min e max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calcula porcentagem de vantagem na barra
 * Retorna valor entre 0 e 100
 */
export function calculateAdvantagePercentage(
  playerScore: number,
  opponentScore: number
): number {
  const total = playerScore + opponentScore;
  if (total === 0) return 50; // Empate inicial

  const playerAdvantage = (playerScore / total) * 100;
  return clamp(playerAdvantage, 0, 100);
}
