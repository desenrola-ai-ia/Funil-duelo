// ============================================
// DESENROLA - Testes de Sanidade para Avaliação
// Execute: npx tsx src/lib/analyze.sanity.ts
// ============================================

interface TestCase {
  name: string;
  roundNumber: number;
  userResponse: string;
  expectedTier: 'A' | 'B' | 'C' | 'D';
  expectedFlags: {
    sexual_too_early?: boolean;
    disrespect_or_insult?: boolean;
    too_intimate_no_rapport?: boolean;
    pushy_or_creepy?: boolean;
    off_context?: boolean;
  };
}

const TEST_CASES: TestCase[] = [
  // ===== ROUND 1 (LOW RAPPORT) =====
  {
    name: 'Round 1 - Sexualização explícita',
    roundNumber: 1,
    userResponse: 'você é muito gostosa',
    expectedTier: 'D',
    expectedFlags: { sexual_too_early: true },
  },
  {
    name: 'Round 1 - Sexualização agressiva',
    roundNumber: 1,
    userResponse: 'quero te comer toda',
    expectedTier: 'D',
    expectedFlags: { sexual_too_early: true },
  },
  {
    name: 'Round 1 - Xingamento',
    roundNumber: 1,
    userResponse: 'vai tomar no cu',
    expectedTier: 'D',
    expectedFlags: { disrespect_or_insult: true },
  },
  {
    name: 'Round 1 - Intimidade forçada',
    roundNumber: 1,
    userResponse: 'oi amor, vem dormir comigo hoje',
    expectedTier: 'D',
    expectedFlags: { too_intimate_no_rapport: true },
  },
  {
    name: 'Round 1 - Resposta genérica',
    roundNumber: 1,
    userResponse: 'oi tudo bem?',
    expectedTier: 'C',
    expectedFlags: {},
  },
  {
    name: 'Round 1 - Resposta normal/boa',
    roundNumber: 1,
    userResponse: 'Culpa do álcool? Sei... você deu match sóbria, agora tá com coragem de falar comigo',
    expectedTier: 'B',
    expectedFlags: {},
  },
  
  // ===== ROUND 2 (MID RAPPORT) =====
  {
    name: 'Round 2 - Sexualização ainda é ruim',
    roundNumber: 2,
    userResponse: 'caramba que corpo hein',
    expectedTier: 'C', // mid rapport, sexual = mínimo C
    expectedFlags: { sexual_too_early: true },
  },
  {
    name: 'Round 2 - Resposta adequada',
    roundNumber: 2,
    userResponse: 'Pelo menos tá rendendo resultado. Bora tomar um açaí depois?',
    expectedTier: 'B',
    expectedFlags: {},
  },
  
  // ===== ROUND 3 (HIGH RAPPORT) =====
  {
    name: 'Round 3 - Flerte leve OK',
    roundNumber: 3,
    userResponse: 'Não vou te dar motivo nenhum. Você fica porque quer, ou vaza porque quis. Sem drama',
    expectedTier: 'A',
    expectedFlags: {},
  },
  {
    name: 'Round 3 - Desrespeito ainda é D',
    roundNumber: 3,
    userResponse: 'você é uma idiota mesmo',
    expectedTier: 'D',
    expectedFlags: { disrespect_or_insult: true },
  },
];

// ============================================
// RUNNER
// ============================================

async function runSanityTests() {
  console.log('\n🧪 TESTES DE SANIDADE - AVALIAÇÃO DE RESPOSTAS\n');
  console.log('='.repeat(60));
  
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    try {
      const response = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: 'Larissa',
          personaAge: 24,
          personaBio: 'sexta, sabado e domingo',
          context: 'Match no Tinder, conversa inicial',
          chatHistory: [
            { sender: 'persona', content: 'e ai' },
            { sender: 'persona', content: 'esse match foi culpa do alcool ou vc e interessante mesmo?' },
          ],
          userResponse: test.userResponse,
          roundNumber: test.roundNumber,
        }),
      });

      const result = await response.json();
      
      const tierMatch = result.tier === test.expectedTier;
      const flagsMatch = Object.entries(test.expectedFlags).every(
        ([key, value]) => result.flags?.[key] === value
      );
      
      const success = tierMatch && flagsMatch;
      
      if (success) {
        console.log(`\n✅ PASS: ${test.name}`);
        passed++;
      } else {
        console.log(`\n❌ FAIL: ${test.name}`);
        console.log(`   Esperado: Tier ${test.expectedTier}, Flags: ${JSON.stringify(test.expectedFlags)}`);
        console.log(`   Recebido: Tier ${result.tier}, Flags: ${JSON.stringify(result.flags)}`);
        console.log(`   Reason: ${result.reason}`);
        failed++;
      }
      
      console.log(`   Response: "${test.userResponse.substring(0, 50)}..."`);
      console.log(`   Round: ${test.roundNumber} | Rapport: ${result.rapport_level}`);
      
    } catch (error) {
      console.log(`\n❌ ERROR: ${test.name}`);
      console.log(`   Erro: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 RESULTADO: ${passed}/${TEST_CASES.length} passaram`);
  
  if (failed > 0) {
    console.log(`⚠️  ${failed} teste(s) falharam`);
    process.exit(1);
  } else {
    console.log('🎉 Todos os testes passaram!');
  }
}

// Run se executado diretamente
runSanityTests().catch(console.error);
