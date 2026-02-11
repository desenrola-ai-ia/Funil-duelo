// ============================================
// DESENROLA - Personas por Dificuldade
// ============================================

import type { Persona, ChatMessage, AISuggestion, PersonaData, Difficulty } from '@/types';

// ============================================
// PERSONAS FACEIS (Round 1 - Roleta)
// Match no Tinder. Ela puxou conversa.
// ============================================

const PERSONA_LARISSA: Persona = {
  id: 'larissa',
  name: 'Larissa',
  age: 24,
  bio: 'sexta, sabado e domingo 🍸 se nao gosta de bar, nem perde tempo',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/01/Gemini_Generated_Image_ri89qqri89qqri89.png',
  context: 'Voces deram match no Tinder. Ela puxou conversa. Sexta a noite, pre-role, vibe aberta.',
  difficulty: 'EASY',
};

const CHAT_LARISSA: ChatMessage[] = [
  { id: 'larissa-1', sender: 'persona', content: 'e ai', time: '22:41' },
  { id: 'larissa-2', sender: 'persona', content: 'esse match foi culpa do alcool ou vc e interessante mesmo? kkk', time: '22:42' },
  { id: 'larissa-3', sender: 'persona', content: 'to saindo agora, mas fiquei curiosa', time: '22:44', isLastMessage: true },
];

const AI_SUGGESTIONS_LARISSA: AISuggestion[] = [
  { id: 'larissa-ai-1', content: 'Culpa do álcool? Você deu match sóbria. Agora só tá com coragem pra falar comigo 😏', tier: 'A' },
  { id: 'larissa-ai-2', content: 'Curioso é você ainda não ter saído de casa. Passa onde você tá que eu decido se vale sair do bar', tier: 'A' },
  { id: 'larissa-ai-3', content: 'Se tá curiosa, vem descobrir. Mas aviso: não sou do tipo que decepciona', tier: 'A' },
];

// ---

const PERSONA_BARBARA: Persona = {
  id: 'barbara',
  name: 'Barbara',
  age: 22,
  bio: 'sem paciencia pra gente sem atitude',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/01/images-12.jpeg',
  context: 'Voces deram match no Tinder. Ela puxou conversa. Inicio da noite, provocacao leve, zero hostilidade.',
  difficulty: 'EASY',
};

const CHAT_BARBARA: ChatMessage[] = [
  { id: 'barbara-1', sender: 'persona', content: 'oi', time: '19:18' },
  { id: 'barbara-2', sender: 'persona', content: 'vc sempre demora pra falar ou e so comigo?', time: '19:19' },
  { id: 'barbara-3', sender: 'persona', content: 'pergunta sincera 😅', time: '19:21', isLastMessage: true },
];

const AI_SUGGESTIONS_BARBARA: AISuggestion[] = [
  { id: 'barbara-ai-1', content: 'Só demoro com quem não me interessa. Com você, to aqui na hora 😏', tier: 'A' },
  { id: 'barbara-ai-2', content: 'Gosto de deixar as melhores esperando um pouco. Aumenta a tensão', tier: 'A' },
  { id: 'barbara-ai-3', content: 'Eu podia mentir e dizer que tava ocupado, mas a real é que tava decidindo se você merecia uma resposta rápida. Mereceu', tier: 'A' },
];

// ---

const PERSONA_PAULA: Persona = {
  id: 'paula',
  name: 'Paula',
  age: 25,
  bio: 'gosto de intensidade. se for sem graca, passo',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/01/29092020225333_WhatsApp_I.jpeg',
  context: 'Voces deram match no Tinder. Ela puxou conversa. Madrugada, flerte explicito, tensao boa.',
  difficulty: 'EASY',
};

const CHAT_PAULA: ChatMessage[] = [
  { id: 'paula-1', sender: 'persona', content: 'confesso que dei match pela sua cara', time: '23:57' },
  { id: 'paula-2', sender: 'persona', content: 'vc parece ter uma vibe meio perigosa 😏', time: '23:58' },
  { id: 'paula-3', sender: 'persona', content: 'ou e so impressao minha?', time: '00:00', isLastMessage: true },
];

const AI_SUGGESTIONS_PAULA: AISuggestion[] = [
  { id: 'paula-ai-1', content: 'Perigosa o suficiente pra você perder o sono. E olha a hora que você me mandou mensagem... já começou', tier: 'A' },
  { id: 'paula-ai-2', content: 'Não é impressão não. Mas só quem se arrisca descobre até onde vai', tier: 'A' },
  { id: 'paula-ai-3', content: 'Você deu match pela minha cara. Imagina quando descobrir o resto 😏', tier: 'A' },
];

// ---

const PERSONA_RENATA_EASY: Persona = {
  id: 'renata-easy',
  name: 'Renata',
  age: 26,
  bio: 'after as vezes. preguica quase sempre',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/01/images-10.jpeg',
  context: 'Voces deram match no Tinder. Ela puxou conversa. Meio de semana, conversa casual que pode ir pra qualquer lado.',
  difficulty: 'EASY',
};

const CHAT_RENATA_EASY: ChatMessage[] = [
  { id: 'renata-easy-1', sender: 'persona', content: 'oi', time: '21:06' },
  { id: 'renata-easy-2', sender: 'persona', content: 'tava entediada', time: '21:07' },
  { id: 'renata-easy-3', sender: 'persona', content: 'ai apareceu vc no tinder', time: '21:09' },
  { id: 'renata-easy-4', sender: 'persona', content: 'me salva desse tedio ai 😅', time: '21:10', isLastMessage: true },
];

const AI_SUGGESTIONS_RENATA_EASY: AISuggestion[] = [
  { id: 'renata-easy-ai-1', content: 'Salvar do tédio é fácil. O difícil vai ser você conseguir parar de falar comigo depois', tier: 'A' },
  { id: 'renata-easy-ai-2', content: 'Aparecer no Tinder quando você tá entediada foi só coincidência ou destino? Vou te entreter tão bem que você vai esquecer que tava entediada', tier: 'A' },
  { id: 'renata-easy-ai-3', content: 'Te salvo sim, mas com uma condição: não vale reclamar quando você viciar nessa conversa', tier: 'A' },
];

// ---

const PERSONA_JULIANA: Persona = {
  id: 'juliana',
  name: 'Juliana',
  age: 23,
  bio: 'nao curto enrolacao. vamos ver no que da',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/01/2jtphts9iw8deejj288olbemg.jpg',
  context: 'Voces deram match no Tinder. Ela puxou conversa. Fim de tarde, direta, sem joguinho.',
  difficulty: 'EASY',
};

const CHAT_JULIANA: ChatMessage[] = [
  { id: 'juliana-1', sender: 'persona', content: 'e ai', time: '18:32' },
  { id: 'juliana-2', sender: 'persona', content: 'vou ser direta', time: '18:33' },
  { id: 'juliana-3', sender: 'persona', content: 'vc parece interessante', time: '18:34' },
  { id: 'juliana-4', sender: 'persona', content: 'e isso mesmo ou so foto boa? 😂', time: '18:36', isLastMessage: true },
];

const AI_SUGGESTIONS_JULIANA: AISuggestion[] = [
  { id: 'juliana-ai-1', content: 'A foto é só o trailer. O filme completo você só vê ao vivo. E já aviso: não tem refund 😏', tier: 'A' },
  { id: 'juliana-ai-2', content: 'Gostei da sua sinceridade. Então vou ser direto também: sou mais interessante do que as fotos mostram. Bem mais', tier: 'A' },
  { id: 'juliana-ai-3', content: 'Isso mesmo. E você já percebeu isso só pelas fotos? Imagina quando descobrir o resto', tier: 'A' },
];

// ============================================
// PERSONAS MEDIAS (Round 2 - Cartas)
// Voce comentou no story dela. Ela respondeu.
// ============================================

const PERSONA_CAROL: Persona = {
  id: 'carol',
  name: 'Carol',
  age: 26,
  bio: 'trabalho demais • viagens quando dá',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/artworks-r88wx2rBNjnzLqNR-sGtbbw-t500x500.jpg',
  context: 'Você comentou o story dela. Ela respondeu neutra mas aberta.',
  storyImage: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/fatigued-by-daily-gym-stories-v0-loazdiogpgdf1.webp',
  storyText: 'sobrevivendo ao treino 💀',
  difficulty: 'MEDIUM',
};

const CHAT_CAROL: ChatMessage[] = [
  { id: 'carol-1', sender: 'user', content: 'isso aí é treino ou castigo? 😂' },
  { id: 'carol-2', sender: 'persona', content: 'treino né 😅 infelizmente', isLastMessage: true },
];

const AI_SUGGESTIONS_CAROL: AISuggestion[] = [
  { id: 'carol-ai-1', content: 'Pelo menos tá rendendo resultado. Bora tomar um açaí depois pra compensar o sofrimento?', tier: 'A' },
  { id: 'carol-ai-2', content: 'Treino bom é treino sofrido. Mas aposto que você reclama e no dia seguinte tá lá de novo', tier: 'A' },
  { id: 'carol-ai-3', content: 'Se precisar de motivação, me avisa. Sou ótimo em ficar falando besteira enquanto você sofre 😏', tier: 'A' },
];

// ---

const PERSONA_RENATA: Persona = {
  id: 'renata',
  name: 'Renata',
  age: 24,
  bio: 'arquitetura • vinho • papo bom',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/LnGD8-F__400x400.jpg',
  context: 'Você comentou o story dela. Ela respondeu seco, tá te testando, não está entregando muito.',
  storyImage: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/fatigued-by-daily-gym-stories-v0-twr1rkogpgdf1.webp',
  storyText: 'disciplina > motivação',
  difficulty: 'MEDIUM',
};

const CHAT_RENATA: ChatMessage[] = [
  { id: 'renata-1', sender: 'user', content: 'disciplina tá em dia 👀' },
  { id: 'renata-2', sender: 'persona', content: 'tem que estar né', isLastMessage: true },
];

const AI_SUGGESTIONS_RENATA: AISuggestion[] = [
  { id: 'renata-ai-1', content: 'Concordo. Mas disciplina sem recompensa é só sofrimento. Qual é a sua?', tier: 'A' },
  { id: 'renata-ai-2', content: 'Gostei da filosofia. Você aplica isso em tudo ou só no treino?', tier: 'A' },
  { id: 'renata-ai-3', content: 'Tem mesmo. E pelo visto tá funcionando', tier: 'A' },
];

// ---

const PERSONA_PRISCILA: Persona = {
  id: 'priscila',
  name: 'Priscila',
  age: 27,
  bio: 'fitness • metas • sem tempo pra joguinho',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/Cabelo-Super-Loiro.jpeg',
  context: 'Você comentou o story dela. Ela respondeu simpática mas encerrou. Se não puxar algo bom, morre.',
  storyImage: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/38625a79ae4257023cf9336baa4a8364.jpg',
  storyText: 'feito. agora posso reclamar 😤',
  difficulty: 'MEDIUM',
};

const CHAT_PRISCILA: ChatMessage[] = [
  { id: 'priscila-1', sender: 'user', content: 'agora sim dá pra reclamar com moral 😌' },
  { id: 'priscila-2', sender: 'persona', content: 'exatamente kkk', isLastMessage: true },
];

const AI_SUGGESTIONS_PRISCILA: AISuggestion[] = [
  { id: 'priscila-ai-1', content: 'E qual vai ser a recompensa? Porque só reclamar não vale', tier: 'A' },
  { id: 'priscila-ai-2', content: 'Agora você pode reclamar e eu posso te chamar pra um açaí. Timing perfeito', tier: 'A' },
  { id: 'priscila-ai-3', content: 'Reclamar é bom, mas comemorar é melhor. O que vem depois do treino?', tier: 'A' },
];

// ============================================
// PERSONAS DIFICEIS (Round 3 - Desafio)
// Exigentes, mensagens ambiguas, dificil de ler
// ============================================

const PERSONA_FERNANDA: Persona = {
  id: 'fernanda',
  name: 'Fernanda',
  age: 27,
  bio: 'nao me interessa gente previsivel',
  context: 'Voces ficaram uma vez numa festa. Desde entao, ela responde de vez em quando.',
  difficulty: 'HARD',
};

const CHAT_FERNANDA: ChatMessage[] = [
  { id: 'fernanda-1', sender: 'user', content: 'pensei em voce hoje' },
  { id: 'fernanda-2', sender: 'persona', content: 'que fofo. pensou o que?' },
  { id: 'fernanda-3', sender: 'user', content: 'aquele dia' },
  { id: 'fernanda-4', sender: 'persona', content: 'hm. e dai?' },
  { id: 'fernanda-5', sender: 'user', content: 'queria repetir' },
  { id: 'fernanda-6', sender: 'persona', content: 'voce e todo mundo' },
  { id: 'fernanda-7', sender: 'persona', content: 'O que te faz diferente dos outros?', isLastMessage: true },
];

const AI_SUGGESTIONS_FERNANDA: AISuggestion[] = [
  { id: 'fernanda-ai-1', content: 'Eu não tô tentando te impressionar. Diferente dos outros, eu não preciso. Você já sabe que aquele dia não foi coincidência', tier: 'A' },
  { id: 'fernanda-ai-2', content: 'O que me faz diferente? Eu não tô aqui implorando sua atenção como todo mundo. Você responde quando quer, eu falo quando tenho algo a dizer. Sem joguinho', tier: 'A' },
  { id: 'fernanda-ai-3', content: 'Você não quer alguém previsível, e eu não sou. Você responde de vez em quando porque testa quem tem paciência. Eu tenho. Mas paciência não é desespero', tier: 'A' },
];

// ---

const PERSONA_VALENTINA: Persona = {
  id: 'valentina',
  name: 'Valentina',
  age: 25,
  bio: 'pilates • vinzinho • não respondo áudio',
  image: 'https://beige-crane-344897.hostingersite.com/wp-content/uploads/2026/02/H51b8849a88614434804a2ba1f6597b98p.avif',
  context: 'Vocês ficaram numa festa há 2 semanas. Trocaram número mas ela demora pra responder e nunca puxa assunto.',
  difficulty: 'HARD',
};

const CHAT_VALENTINA: ChatMessage[] = [
  { id: 'valentina-1', sender: 'user', content: 'e ai val, como foi o fds?', time: '20:12' },
  { id: 'valentina-2', sender: 'persona', content: 'foi bem', time: '20:47' },
  { id: 'valentina-3', sender: 'user', content: 'que bom kk fiz um churrasco aqui foi massa', time: '20:48' },
  { id: 'valentina-4', sender: 'persona', content: 'legal', time: '21:03' },
  { id: 'valentina-5', sender: 'user', content: 'vc ta bem? to sentindo vc meio distante', time: '21:05' },
  { id: 'valentina-6', sender: 'persona', content: 'to normal kkk', time: '21:15' },
  { id: 'valentina-7', sender: 'persona', content: 'mas fala, o q vc quer?', time: '21:15', isLastMessage: true },
];

const AI_SUGGESTIONS_VALENTINA: AISuggestion[] = [
  { id: 'valentina-ai-1', content: 'Quero te ver de novo. Aquele dia foi bom mas a gente mal conversou direito. Bora tomar um vinho essa semana?', tier: 'A' },
  { id: 'valentina-ai-2', content: 'Nada demais, lembrei de você e quis trocar ideia. Mas se tiver ocupada a gente marca outro dia', tier: 'A' },
  { id: 'valentina-ai-3', content: 'Achei que a gente podia se conhecer melhor sem 30 pessoas em volta. Quinta eu to livre, cola comigo?', tier: 'A' },
];

// ---

const PERSONA_ISABELA: Persona = {
  id: 'isabela',
  name: 'Isabela',
  age: 28,
  bio: '10/10 ou nada',
  context: 'Ela e disputada. Voces mal se falam mas ela respondeu seu story.',
  difficulty: 'HARD',
};

const CHAT_ISABELA: ChatMessage[] = [
  { id: 'isabela-1', sender: 'persona', content: 'legal seu story' },
  { id: 'isabela-2', sender: 'user', content: 'obrigado! nao esperava sua msg' },
  { id: 'isabela-3', sender: 'persona', content: 'por que nao?' },
  { id: 'isabela-4', sender: 'user', content: 'voce parece ocupada' },
  { id: 'isabela-5', sender: 'persona', content: 'sou. e seleciono bem quem merece meu tempo' },
  { id: 'isabela-6', sender: 'user', content: 'e eu mereci?' },
  { id: 'isabela-7', sender: 'persona', content: 'Ainda to decidindo. Me convence.', isLastMessage: true },
];

const AI_SUGGESTIONS_ISABELA: AISuggestion[] = [
  { id: 'isabela-ai-1', content: 'Convencer não é o jogo. Você respondeu meu story, não pedi. Você já decidiu que eu mereço seu tempo. Agora é só confirmar', tier: 'A' },
  { id: 'isabela-ai-2', content: 'Você não quer alguém desesperado tentando te impressionar. Quer alguém que te desafie. E eu não preciso te convencer de nada que você já não saiba', tier: 'A' },
  { id: 'isabela-ai-3', content: 'Você seleciona bem quem merece seu tempo? Ótimo. Eu também. E você respondeu MEU story. Acho que a gente já se convenceu', tier: 'A' },
];

// ============================================
// AGRUPAMENTO POR DIFICULDADE
// ============================================

export const EASY_PERSONAS: PersonaData[] = [
  { persona: PERSONA_LARISSA, chat: CHAT_LARISSA, aiSuggestions: AI_SUGGESTIONS_LARISSA },
  { persona: PERSONA_BARBARA, chat: CHAT_BARBARA, aiSuggestions: AI_SUGGESTIONS_BARBARA },
  { persona: PERSONA_PAULA, chat: CHAT_PAULA, aiSuggestions: AI_SUGGESTIONS_PAULA },
  { persona: PERSONA_RENATA_EASY, chat: CHAT_RENATA_EASY, aiSuggestions: AI_SUGGESTIONS_RENATA_EASY },
  { persona: PERSONA_JULIANA, chat: CHAT_JULIANA, aiSuggestions: AI_SUGGESTIONS_JULIANA },
];

export const MEDIUM_PERSONAS: PersonaData[] = [
  { persona: PERSONA_CAROL, chat: CHAT_CAROL, aiSuggestions: AI_SUGGESTIONS_CAROL },
  { persona: PERSONA_RENATA, chat: CHAT_RENATA, aiSuggestions: AI_SUGGESTIONS_RENATA },
  { persona: PERSONA_PRISCILA, chat: CHAT_PRISCILA, aiSuggestions: AI_SUGGESTIONS_PRISCILA },
];

export const HARD_PERSONAS: PersonaData[] = [
  { persona: PERSONA_FERNANDA, chat: CHAT_FERNANDA, aiSuggestions: AI_SUGGESTIONS_FERNANDA },
  { persona: PERSONA_VALENTINA, chat: CHAT_VALENTINA, aiSuggestions: AI_SUGGESTIONS_VALENTINA },
  { persona: PERSONA_ISABELA, chat: CHAT_ISABELA, aiSuggestions: AI_SUGGESTIONS_ISABELA },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Retorna uma persona aleatoria da dificuldade especificada
 */
export function getRandomPersonaByDifficulty(difficulty: Difficulty): PersonaData {
  const personas = {
    EASY: EASY_PERSONAS,
    MEDIUM: MEDIUM_PERSONAS,
    HARD: HARD_PERSONAS,
  };
  const pool = personas[difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Retorna todas as personas de uma dificuldade
 */
export function getPersonasByDifficulty(difficulty: Difficulty): PersonaData[] {
  const personas = {
    EASY: EASY_PERSONAS,
    MEDIUM: MEDIUM_PERSONAS,
    HARD: HARD_PERSONAS,
  };
  return personas[difficulty];
}

/**
 * Retorna uma persona especifica pelo ID
 */
export function getPersonaById(id: string): PersonaData | undefined {
  const allPersonas = [...EASY_PERSONAS, ...MEDIUM_PERSONAS, ...HARD_PERSONAS];
  return allPersonas.find((p) => p.persona.id === id);
}

// ============================================
// EXPORTS LEGADOS (compatibilidade)
// ============================================

export const PERSONA_LARA = PERSONA_LARISSA;
export const PERSONA_CAMILA = PERSONA_CAROL;
export const PERSONA_BIA = PERSONA_FERNANDA;
