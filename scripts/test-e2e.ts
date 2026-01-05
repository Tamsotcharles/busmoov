/**
 * Script de tests E2E pour Busmoov
 *
 * Ce script simule les parcours utilisateurs critiques pour détecter les bugs.
 * Peut être exécuté avec: npx tsx scripts/test-e2e.ts
 *
 * Pour une version complète, installer Playwright: npm install -D @playwright/test
 */

// =====================================================
// CONFIGURATION
// =====================================================

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || ''
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || ''

// =====================================================
// TYPES
// =====================================================

interface TestResult {
  name: string
  passed: boolean
  error?: string
  duration: number
}

interface TestSuite {
  name: string
  tests: TestResult[]
}

// =====================================================
// UTILITAIRES DE TEST
// =====================================================

class TestRunner {
  private results: TestSuite[] = []
  private currentSuite: TestSuite | null = null

  startSuite(name: string) {
    this.currentSuite = { name, tests: [] }
    console.log(`\n${'='.repeat(60)}`)
    console.log(`SUITE: ${name}`)
    console.log('='.repeat(60))
  }

  endSuite() {
    if (this.currentSuite) {
      this.results.push(this.currentSuite)
      const passed = this.currentSuite.tests.filter(t => t.passed).length
      const total = this.currentSuite.tests.length
      console.log(`\nRésultat: ${passed}/${total} tests passés`)
    }
    this.currentSuite = null
  }

  async runTest(name: string, testFn: () => Promise<void>) {
    const startTime = Date.now()
    console.log(`\n  TEST: ${name}`)

    try {
      await testFn()
      const duration = Date.now() - startTime
      this.currentSuite?.tests.push({ name, passed: true, duration })
      console.log(`    ✓ PASS (${duration}ms)`)
    } catch (error) {
      const duration = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.currentSuite?.tests.push({ name, passed: false, error: errorMessage, duration })
      console.log(`    ✗ FAIL: ${errorMessage} (${duration}ms)`)
    }
  }

  getReport(): { total: number; passed: number; failed: number; results: TestSuite[] } {
    const total = this.results.reduce((acc, suite) => acc + suite.tests.length, 0)
    const passed = this.results.reduce((acc, suite) => acc + suite.tests.filter(t => t.passed).length, 0)
    return {
      total,
      passed,
      failed: total - passed,
      results: this.results
    }
  }

  printReport() {
    const report = this.getReport()
    console.log(`\n${'='.repeat(60)}`)
    console.log('RAPPORT FINAL')
    console.log('='.repeat(60))
    console.log(`Total: ${report.total} tests`)
    console.log(`Passés: ${report.passed}`)
    console.log(`Échoués: ${report.failed}`)

    if (report.failed > 0) {
      console.log('\nTests échoués:')
      for (const suite of report.results) {
        for (const test of suite.tests) {
          if (!test.passed) {
            console.log(`  - [${suite.name}] ${test.name}: ${test.error}`)
          }
        }
      }
    }
  }
}

// =====================================================
// HELPERS
// =====================================================

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

// =====================================================
// TESTS: PAGES PUBLIQUES
// =====================================================

async function testPublicPages(runner: TestRunner) {
  runner.startSuite('Pages Publiques')

  await runner.runTest('Homepage charge correctement', async () => {
    const response = await fetchWithTimeout(BASE_URL)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page CGV charge correctement', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/cgv`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page A Propos charge correctement', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/a-propos`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Contact charge correctement', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/contact`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Devenir Partenaire charge correctement', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/devenir-partenaire`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Redirection vers homepage pour route inconnue', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/route-inexistante-123`)
    assert(response.ok, 'La redirection devrait fonctionner')
  })

  runner.endSuite()
}

// =====================================================
// TESTS: API SUPABASE
// =====================================================

async function testSupabaseAPI(runner: TestRunner) {
  runner.startSuite('API Supabase')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  SKIP: Variables Supabase non configurées')
    runner.endSuite()
    return
  }

  await runner.runTest('Connexion à Supabase', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Lecture des transporteurs (RLS)', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/transporteurs?select=id,name&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Lecture des CGV actives', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/cgv?select=*&is_active=eq.true&limit=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('RLS bloque accès admin_users (anon)', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/admin_users?select=*`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    // Devrait retourner un tableau vide ou une erreur RLS
    assert(Array.isArray(data) && data.length === 0, 'RLS devrait bloquer accès aux admin_users')
  })

  await runner.runTest('Lecture experiments (A/B Testing)', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/experiments?select=*&status=eq.active`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    assert(response.ok, `Status: ${response.status}`)
  })

  runner.endSuite()
}

// =====================================================
// TESTS: FLUX CLIENT
// =====================================================

async function testClientFlows(runner: TestRunner) {
  runner.startSuite('Flux Client')

  await runner.runTest('Page Espace Client accessible', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/espace-client`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Mes Devis avec paramètres', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/mes-devis?ref=TEST&email=test@test.com`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Paiement avec paramètres', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/paiement?ref=TEST&email=test@test.com`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Infos Voyage accessible', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/infos-voyage?ref=TEST&email=test@test.com`)
    assert(response.ok, `Status: ${response.status}`)
  })

  runner.endSuite()
}

// =====================================================
// TESTS: FLUX ADMIN
// =====================================================

async function testAdminFlows(runner: TestRunner) {
  runner.startSuite('Flux Admin')

  await runner.runTest('Page Admin Login accessible', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/admin/login`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Redirection admin non authentifié', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/admin/dashboard`)
    // Devrait charger (React gère la redirection côté client)
    assert(response.ok, `Status: ${response.status}`)
  })

  runner.endSuite()
}

// =====================================================
// TESTS: FLUX FOURNISSEUR
// =====================================================

async function testFournisseurFlows(runner: TestRunner) {
  runner.startSuite('Flux Fournisseur')

  await runner.runTest('Page Validation BPA avec token', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/validation-bpa?token=test-token`)
    assert(response.ok, `Status: ${response.status}`)
  })

  await runner.runTest('Page Chauffeur Info avec token', async () => {
    const response = await fetchWithTimeout(`${BASE_URL}/fournisseur/chauffeur?token=test-token`)
    assert(response.ok, `Status: ${response.status}`)
  })

  runner.endSuite()
}

// =====================================================
// TESTS: VALIDATION DES DONNÉES
// =====================================================

async function testDataValidation(runner: TestRunner) {
  runner.startSuite('Validation des Données')

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('  SKIP: Variables Supabase non configurées')
    runner.endSuite()
    return
  }

  await runner.runTest('Dossiers ont des références valides', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dossiers?select=reference&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    for (const dossier of data) {
      assert(dossier.reference && dossier.reference.length > 0, `Référence invalide: ${dossier.reference}`)
    }
  })

  await runner.runTest('Devis ont des prix valides', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/devis?select=price_ht,price_ttc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    for (const devis of data) {
      assert(
        devis.price_ht >= 0 && devis.price_ttc >= devis.price_ht,
        `Prix invalide: HT=${devis.price_ht}, TTC=${devis.price_ttc}`
      )
    }
  })

  await runner.runTest('Factures ont des montants cohérents', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/factures?select=amount_ht,amount_tva,amount_ttc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    for (const facture of data) {
      const calculatedTTC = Number(facture.amount_ht) + Number(facture.amount_tva)
      const tolerance = 0.01 // 1 centime de tolérance pour les arrondis
      assert(
        Math.abs(calculatedTTC - Number(facture.amount_ttc)) < tolerance,
        `Montants incohérents: HT=${facture.amount_ht} + TVA=${facture.amount_tva} != TTC=${facture.amount_ttc}`
      )
    }
  })

  await runner.runTest('Contrats ont des montants acompte/solde cohérents', async () => {
    const response = await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/contrats?select=price_ttc,acompte_amount,solde_amount&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    })
    const data = await response.json()
    for (const contrat of data) {
      if (contrat.acompte_amount && contrat.solde_amount) {
        const total = Number(contrat.acompte_amount) + Number(contrat.solde_amount)
        const tolerance = 0.01
        assert(
          Math.abs(total - Number(contrat.price_ttc)) < tolerance,
          `Contrat incohérent: acompte=${contrat.acompte_amount} + solde=${contrat.solde_amount} != total=${contrat.price_ttc}`
        )
      }
    }
  })

  runner.endSuite()
}

// =====================================================
// TESTS: PERFORMANCE
// =====================================================

async function testPerformance(runner: TestRunner) {
  runner.startSuite('Performance')

  await runner.runTest('Homepage charge en moins de 3s', async () => {
    const start = Date.now()
    await fetchWithTimeout(BASE_URL)
    const duration = Date.now() - start
    assert(duration < 3000, `Temps de chargement: ${duration}ms (max 3000ms)`)
  })

  if (SUPABASE_URL && SUPABASE_KEY) {
    await runner.runTest('Query dossiers < 1s', async () => {
      const start = Date.now()
      await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dossiers?select=*&limit=50`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        }
      })
      const duration = Date.now() - start
      assert(duration < 1000, `Temps de query: ${duration}ms (max 1000ms)`)
    })

    await runner.runTest('Query avec jointures < 2s', async () => {
      const start = Date.now()
      await fetchWithTimeout(
        `${SUPABASE_URL}/rest/v1/dossiers?select=*,transporteur:transporteurs(*),demande:demandes(*)&limit=20`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
          }
        }
      )
      const duration = Date.now() - start
      assert(duration < 2000, `Temps de query avec jointures: ${duration}ms (max 2000ms)`)
    })
  }

  runner.endSuite()
}

// =====================================================
// MAIN
// =====================================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗')
  console.log('║           TESTS E2E - BUSMOOV CRM                          ║')
  console.log('║           Phase de test de stabilité                       ║')
  console.log('╚════════════════════════════════════════════════════════════╝')
  console.log(`\nBase URL: ${BASE_URL}`)
  console.log(`Supabase: ${SUPABASE_URL ? 'Configuré' : 'Non configuré'}`)
  console.log(`Date: ${new Date().toISOString()}`)

  const runner = new TestRunner()

  try {
    await testPublicPages(runner)
    await testSupabaseAPI(runner)
    await testClientFlows(runner)
    await testAdminFlows(runner)
    await testFournisseurFlows(runner)
    await testDataValidation(runner)
    await testPerformance(runner)
  } catch (error) {
    console.error('\nErreur fatale:', error)
  }

  runner.printReport()

  const report = runner.getReport()
  process.exit(report.failed > 0 ? 1 : 0)
}

main()
