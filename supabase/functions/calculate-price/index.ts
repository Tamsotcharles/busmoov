import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// =============================================
// CONSTANTES TARIFAIRES (CONFIDENTIELLES)
// =============================================

const REGLES_CHAUFFEUR = {
  CONDUITE_CONTINUE_MAX_JOUR: 4.5,
  CONDUITE_CONTINUE_MAX_NUIT: 4,
  CONDUITE_MAX_JOUR: 9,
  CONDUITE_MAX_JOUR_EXTENSION: 10,
  AMPLITUDE_MAX_1_CHAUFFEUR: 12,
  AMPLITUDE_MAX_AVEC_COUPURE: 14,
  AMPLITUDE_MAX_2_CHAUFFEURS: 18,
  REPOS_QUOTIDIEN_MIN: 11,
  REPOS_REDUIT_MIN: 9,
  PAUSE_OBLIGATOIRE: 45,
  COUPURE_MIN_POUR_14H: 3,
  COUT_RELAIS_CHAUFFEUR: 500,
  VITESSE_MOYENNE_AUTOCAR: 70,
  COEF_TEMPS_AUTOCAR: 1.20,
} as const;

const TARIFS_HORS_GRILLE = {
  PRIX_KM_SUPPLEMENTAIRE: 3,
  PETIT_KM_SEUIL: 50,
  PETIT_KM_BASE: 690,
  PETIT_KM_AMPLITUDE_5H_PLUS: 790,
  PETIT_KM_AMPLITUDE_5H_PLUS_50: 830,
  GRILLE_ALLER_SIMPLE_MAX: 400,
  GRILLE_AR_1J_MAX: 500,
  GRILLE_AR_MAD_MIN: 70,
  GRILLE_AR_MAD_MAX: 600,
  GRILLE_AR_SANS_MAD_MIN: 100,
  GRILLE_AR_SANS_MAD_MAX: 500,
  SUPPLEMENT_JOUR_MAD: 800,
  SUPPLEMENT_JOUR_SANS_MAD: 600,
} as const;

const DEPARTEMENTS_PROBLEMATIQUES = [
  '27', '28', '60', '02', '51', '10', '89', '45',
  '14', '50', '35', '76',
  '29', '22', '56',
  '54', '68', '53', '72', '61', '37',
  '49',
  '39', '25', '70', '01',
  '38', '26', '42',
  '64', '65', '40', '47', '32',
  '09', '11',
  '30', '83', '84', '04', '05'
] as const;

// =============================================
// TYPES
// =============================================

type ServiceType = 'aller_simple' | 'ar_1j' | 'ar_mad' | 'ar_sans_mad';
type AmplitudeType = '8h' | '10h' | '12h' | '9h_coupure';

interface CalculRequest {
  distanceKm: number;
  typeService: ServiceType;
  nbJours?: number;
  nbPassagers?: number;
  villeDepartAvecCP?: string;
  heureDepart?: string;
  heureRetour?: string;
  dateDepart?: string;
  dateRetour?: string;
  coefficientVehicule?: number;
  nombreCars?: number;
}

interface PriceEstimate {
  prixMin: number;
  prixMax: number;
  nbChauffeurs: number;
  nbCars: number;
  detailType: string;
}

// =============================================
// FONCTIONS UTILITAIRES
// =============================================

function extraireDepartement(villeAvecCP: string | null | undefined): string | null {
  if (!villeAvecCP) return null;
  const match = villeAvecCP.match(/\((\d{2,5})\)/);
  if (match) {
    const cp = match[1];
    if (cp.length === 5) {
      const dept = cp.substring(0, 2);
      if (dept === '20') {
        return cp.substring(0, 3) === '201' ? '2A' : '2B';
      }
      return dept;
    }
    return cp.substring(0, 2);
  }
  return null;
}

function estDepartementProblematique(dept: string | null): boolean {
  if (!dept) return false;
  return (DEPARTEMENTS_PROBLEMATIQUES as readonly string[]).includes(dept);
}

function determinerAmplitudeGrille(amplitudeHeures: number): AmplitudeType {
  if (amplitudeHeures <= 8) return '8h';
  if (amplitudeHeures <= 10) return '10h';
  if (amplitudeHeures <= 12) return '12h';
  return '9h_coupure';
}

// =============================================
// CALCUL INFOS TRAJET
// =============================================

function calculerInfosTrajet(
  distanceKm: number,
  heureDepart: string | null,
  heureRetour: string | null,
  dateDepart: string | null,
  dateRetour: string | null,
  typeService: ServiceType
) {
  const R = REGLES_CHAUFFEUR;

  const tempsConduiteAller = (distanceKm / R.VITESSE_MOYENNE_AUTOCAR) * R.COEF_TEMPS_AUTOCAR;
  const tempsConduiteRetour = tempsConduiteAller;
  const tempsConduiteAR = tempsConduiteAller + tempsConduiteRetour;

  const pausesAller = Math.floor(tempsConduiteAller / R.CONDUITE_CONTINUE_MAX_JOUR);
  const pausesRetour = Math.floor(tempsConduiteRetour / R.CONDUITE_CONTINUE_MAX_JOUR);

  const tempsTotalAller = tempsConduiteAller + (pausesAller * R.PAUSE_OBLIGATOIRE / 60);
  const tempsTotalRetour = tempsConduiteRetour + (pausesRetour * R.PAUSE_OBLIGATOIRE / 60);

  let nbJoursVoyage = 1;
  let estMemeJour = true;
  if (dateDepart && dateRetour) {
    const depDateStr = dateDepart.substring(0, 10);
    const retDateStr = dateRetour.substring(0, 10);
    const [depYear, depMonth, depDay] = depDateStr.split('-').map(Number);
    const [retYear, retMonth, retDay] = retDateStr.split('-').map(Number);
    const d1 = new Date(Date.UTC(depYear, depMonth - 1, depDay));
    const d2 = new Date(Date.UTC(retYear, retMonth - 1, retDay));
    nbJoursVoyage = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    estMemeJour = d1.getTime() === d2.getTime();
  }

  let amplitudeJournee: number | null = null;
  let tempsAttenteSurPlace = 0;
  let minutesArriveeDestination = 0;

  if (heureDepart) {
    const [h, m] = heureDepart.split(':').map(Number);
    const minutesDepart = h * 60 + m;
    minutesArriveeDestination = minutesDepart + Math.round(tempsTotalAller * 60);
  }

  if (heureDepart && heureRetour) {
    const [hDep, mDep] = heureDepart.split(':').map(Number);
    const [hRet, mRet] = heureRetour.split(':').map(Number);
    const minutesDepartMatin = hDep * 60 + mDep;
    let minutesDepartRetour = hRet * 60 + mRet;

    if (!estMemeJour && dateDepart && dateRetour) {
      const diffJours = nbJoursVoyage - 1;
      minutesDepartRetour += diffJours * 24 * 60;
    }

    const minutesRetourDepot = minutesDepartRetour + Math.round(tempsTotalRetour * 60);
    tempsAttenteSurPlace = (minutesDepartRetour - minutesArriveeDestination) / 60;
    if (tempsAttenteSurPlace < 0) tempsAttenteSurPlace = 0;

    if (typeService === 'ar_1j' || estMemeJour) {
      amplitudeJournee = (minutesRetourDepot - minutesDepartMatin) / 60;
    }
  }

  // Calcul nombre de chauffeurs
  let nbChauffeurs = 1;
  let raisonDeuxChauffeurs = '';

  if (tempsAttenteSurPlace >= R.REPOS_REDUIT_MIN) {
    const amplitudeAller = tempsTotalAller;
    const amplitudeRetour = tempsTotalRetour;

    if (amplitudeAller > R.AMPLITUDE_MAX_1_CHAUFFEUR || amplitudeRetour > R.AMPLITUDE_MAX_1_CHAUFFEUR) {
      nbChauffeurs = 2;
      raisonDeuxChauffeurs = `Un trajet dépasse 12h d'amplitude`;
    } else if (tempsConduiteAller > R.CONDUITE_MAX_JOUR_EXTENSION || tempsConduiteRetour > R.CONDUITE_MAX_JOUR_EXTENSION) {
      nbChauffeurs = 2;
      raisonDeuxChauffeurs = `Conduite > 10h max par trajet`;
    }
  } else {
    if (amplitudeJournee) {
      if (amplitudeJournee > R.AMPLITUDE_MAX_AVEC_COUPURE) {
        nbChauffeurs = 2;
        raisonDeuxChauffeurs = `Amplitude > 14h max`;
      } else if (amplitudeJournee > R.AMPLITUDE_MAX_1_CHAUFFEUR) {
        if (tempsAttenteSurPlace < R.COUPURE_MIN_POUR_14H) {
          nbChauffeurs = 2;
          raisonDeuxChauffeurs = `Amplitude > 12h et coupure < 3h`;
        }
      }
    }

    if (typeService === 'ar_1j' || estMemeJour) {
      if (tempsConduiteAR > R.CONDUITE_MAX_JOUR_EXTENSION) {
        nbChauffeurs = 2;
        raisonDeuxChauffeurs = `Conduite > 10h max/jour`;
      }
    }
  }

  // Coût relais chauffeur
  let coutRelaisChauffeur = 0;
  if (nbChauffeurs === 2) {
    const nbTransferts = (typeService === 'aller_simple' || typeService === 'ar_1j') ? 1 : 2;
    coutRelaisChauffeur = nbTransferts * R.COUT_RELAIS_CHAUFFEUR;
  }

  return {
    tempsConduiteAR,
    tempsTotalAller,
    tempsTotalRetour,
    amplitudeJournee,
    tempsAttenteSurPlace,
    estMemeJour,
    nbJoursVoyage,
    nbChauffeurs,
    raisonDeuxChauffeurs,
    coutRelaisChauffeur,
  };
}

// =============================================
// CALCUL TARIF
// =============================================

interface TarifAllerSimple {
  km_min: number;
  km_max: number;
  prix_public: number;
}

interface TarifAR1J {
  km_min: number;
  km_max: number;
  prix_8h: number | null;
  prix_10h: number | null;
  prix_12h: number | null;
  prix_9h_coupure: number | null;
}

interface TarifARMAD {
  km_min: number;
  km_max: number;
  prix_2j: number | null;
  prix_3j: number | null;
  prix_4j: number | null;
  prix_5j: number | null;
  prix_6j: number | null;
  supplement_jour: number | null;
}

interface TarifARSansMAD {
  km_min: number;
  km_max: number;
  prix_2j: number | null;
  prix_3j: number | null;
  prix_4j: number | null;
  prix_5j: number | null;
  prix_6j: number | null;
  supplement_jour: number | null;
}

async function calculerTarif(
  supabase: ReturnType<typeof createClient>,
  params: CalculRequest
): Promise<PriceEstimate | { erreur: string }> {
  const {
    distanceKm,
    typeService,
    nbJours = 1,
    villeDepartAvecCP,
    heureDepart,
    heureRetour,
    dateDepart,
    dateRetour,
    coefficientVehicule = 1,
    nombreCars = 1,
  } = params;

  const T = TARIFS_HORS_GRILLE;

  if (!distanceKm || distanceKm <= 0) {
    return { erreur: 'Distance invalide' };
  }

  // Charger les grilles tarifaires
  const [resAS, resAR1J, resARMAD, resARSansMAD] = await Promise.all([
    supabase.from('tarifs_aller_simple').select('*').order('km_min'),
    supabase.from('tarifs_ar_1j').select('*').order('km_min'),
    supabase.from('tarifs_ar_mad').select('*').order('km_min'),
    supabase.from('tarifs_ar_sans_mad').select('*').order('km_min'),
  ]);

  const toNum = (val: unknown): number => parseFloat(String(val)) || 0;
  const toNumOrNull = (val: unknown): number | null => val != null ? parseFloat(String(val)) || null : null;

  const grilles = {
    tarifsAllerSimple: (resAS.data || []).map((t: Record<string, unknown>) => ({
      km_min: t.km_min as number,
      km_max: t.km_max as number,
      prix_public: toNum(t.prix_public),
    })) as TarifAllerSimple[],
    tarifsAR1J: (resAR1J.data || []).map((t: Record<string, unknown>) => ({
      km_min: t.km_min as number,
      km_max: t.km_max as number,
      prix_8h: toNumOrNull(t.prix_8h),
      prix_10h: toNumOrNull(t.prix_10h),
      prix_12h: toNumOrNull(t.prix_12h),
      prix_9h_coupure: toNumOrNull(t.prix_9h_coupure),
    })) as TarifAR1J[],
    tarifsARMAD: (resARMAD.data || []).map((t: Record<string, unknown>) => ({
      km_min: t.km_min as number,
      km_max: t.km_max as number,
      prix_2j: toNumOrNull(t.prix_2j),
      prix_3j: toNumOrNull(t.prix_3j),
      prix_4j: toNumOrNull(t.prix_4j),
      prix_5j: toNumOrNull(t.prix_5j),
      prix_6j: toNumOrNull(t.prix_6j),
      supplement_jour: toNumOrNull(t.supplement_jour),
    })) as TarifARMAD[],
    tarifsARSansMAD: (resARSansMAD.data || []).map((t: Record<string, unknown>) => ({
      km_min: t.km_min as number,
      km_max: t.km_max as number,
      prix_2j: toNumOrNull(t.prix_2j),
      prix_3j: toNumOrNull(t.prix_3j),
      prix_4j: toNumOrNull(t.prix_4j),
      prix_5j: toNumOrNull(t.prix_5j),
      prix_6j: toNumOrNull(t.prix_6j),
      supplement_jour: toNumOrNull(t.supplement_jour),
    })) as TarifARSansMAD[],
  };

  // Calcul infos trajet
  const infosTrajet = calculerInfosTrajet(
    distanceKm,
    heureDepart || null,
    heureRetour || null,
    dateDepart || null,
    dateRetour || null,
    typeService
  );

  // Majoration département problématique
  let majorationAutoRegion = 0;
  const departement = extraireDepartement(villeDepartAvecCP);
  if (departement && estDepartementProblematique(departement)) {
    majorationAutoRegion = 0.05;
  }

  let prixBase = 0;
  let kmHorsCadre = 0;
  let supplementHorsCadre = 0;
  let detailType = '';
  let amplitudeUtilisee: AmplitudeType | null = null;
  let joursSupplementaires = 0;
  let supplementJours = 0;

  // ============ ALLER SIMPLE ============
  if (typeService === 'aller_simple') {
    const grille = grilles.tarifsAllerSimple;
    const maxGrille = T.GRILLE_ALLER_SIMPLE_MAX;

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max);

    if (distanceKm > maxGrille) {
      tranche = grille[grille.length - 1];
      kmHorsCadre = distanceKm - maxGrille;
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2;
    }

    if (!tranche && grille.length > 0) {
      tranche = grille[0];
    }

    prixBase = tranche ? Number(tranche.prix_public) : 0;
    detailType = 'Aller simple';
  }

  // ============ AR 1 JOUR ============
  else if (typeService === 'ar_1j') {
    const grille = grilles.tarifsAR1J;
    const maxGrille = T.GRILLE_AR_1J_MAX;

    if (distanceKm <= T.PETIT_KM_SEUIL) {
      prixBase = T.PETIT_KM_BASE;
      if (infosTrajet.amplitudeJournee && infosTrajet.amplitudeJournee > 5) {
        prixBase = distanceKm <= 20 ? T.PETIT_KM_AMPLITUDE_5H_PLUS : T.PETIT_KM_AMPLITUDE_5H_PLUS_50;
      }
      detailType = `AR 1 jour (petit km)`;
    } else {
      amplitudeUtilisee = infosTrajet.amplitudeJournee
        ? determinerAmplitudeGrille(infosTrajet.amplitudeJournee)
        : '12h';

      let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max);

      if (distanceKm > maxGrille) {
        tranche = grille[grille.length - 1];
        kmHorsCadre = distanceKm - maxGrille;
        supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2;
      }

      if (tranche) {
        const amplitudeKey = `prix_${amplitudeUtilisee}` as keyof TarifAR1J;
        prixBase = Number(tranche[amplitudeKey]) || 0;

        if (!prixBase) {
          const amplitudes: (keyof TarifAR1J)[] = ['prix_8h', 'prix_10h', 'prix_12h', 'prix_9h_coupure'];
          for (const amp of amplitudes) {
            if (tranche[amp]) {
              prixBase = Number(tranche[amp]);
              break;
            }
          }
        }
      }

      if (!prixBase) {
        return { erreur: 'Amplitude non disponible' };
      }

      detailType = `AR 1 jour`;
    }
  }

  // ============ AR MAD ============
  else if (typeService === 'ar_mad') {
    const grille = grilles.tarifsARMAD;

    if (distanceKm < T.GRILLE_AR_MAD_MIN) {
      return { erreur: `Distance minimum ${T.GRILLE_AR_MAD_MIN} km pour MAD` };
    }

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max);

    if (distanceKm > T.GRILLE_AR_MAD_MAX) {
      tranche = grille[grille.length - 1];
      kmHorsCadre = distanceKm - T.GRILLE_AR_MAD_MAX;
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2;
    }

    if (tranche) {
      const supplementParJour = Number(tranche.supplement_jour) || T.SUPPLEMENT_JOUR_MAD;

      if (nbJours > 6) {
        joursSupplementaires = nbJours - 6;
        supplementJours = joursSupplementaires * supplementParJour;
        prixBase = Number(tranche.prix_6j) || 0;
      } else {
        const joursKey = `prix_${nbJours}j` as keyof TarifARMAD;
        prixBase = Number(tranche[joursKey]) || 0;

        if (!prixBase) {
          let dernierJourDispo = 0;
          let dernierPrix = 0;
          for (let j = nbJours - 1; j >= 2; j--) {
            const key = `prix_${j}j` as keyof TarifARMAD;
            const prix = Number(tranche[key]) || 0;
            if (prix > 0) {
              dernierJourDispo = j;
              dernierPrix = prix;
              break;
            }
          }
          if (dernierPrix > 0) {
            prixBase = dernierPrix;
            joursSupplementaires = nbJours - dernierJourDispo;
            supplementJours = joursSupplementaires * supplementParJour;
          }
        }
      }
    }

    detailType = `AR ${nbJours} jours avec MAD`;
  }

  // ============ AR SANS MAD ============
  else if (typeService === 'ar_sans_mad') {
    const grille = grilles.tarifsARSansMAD;

    if (distanceKm < T.GRILLE_AR_SANS_MAD_MIN) {
      return { erreur: `Distance minimum ${T.GRILLE_AR_SANS_MAD_MIN} km` };
    }

    let tranche = grille.find(t => distanceKm > t.km_min && distanceKm <= t.km_max);

    if (distanceKm > T.GRILLE_AR_SANS_MAD_MAX) {
      tranche = grille[grille.length - 1];
      kmHorsCadre = distanceKm - T.GRILLE_AR_SANS_MAD_MAX;
      supplementHorsCadre = kmHorsCadre * T.PRIX_KM_SUPPLEMENTAIRE * 2;
    }

    if (tranche) {
      const supplementParJour = Number(tranche.supplement_jour) || T.SUPPLEMENT_JOUR_SANS_MAD;

      if (nbJours > 6) {
        joursSupplementaires = nbJours - 6;
        supplementJours = joursSupplementaires * supplementParJour;
        prixBase = Number(tranche.prix_6j) || 0;
      } else {
        const joursKey = `prix_${nbJours}j` as keyof TarifARSansMAD;
        prixBase = Number(tranche[joursKey]) || 0;

        if (!prixBase) {
          let dernierJourDispo = 0;
          let dernierPrix = 0;
          for (let j = nbJours - 1; j >= 2; j--) {
            const key = `prix_${j}j` as keyof TarifARSansMAD;
            const prix = Number(tranche[key]) || 0;
            if (prix > 0) {
              dernierJourDispo = j;
              dernierPrix = prix;
              break;
            }
          }
          if (dernierPrix > 0) {
            prixBase = dernierPrix;
            joursSupplementaires = nbJours - dernierJourDispo;
            supplementJours = joursSupplementaires * supplementParJour;
          }
        }
      }

      if (!prixBase) {
        return { erreur: 'Durée non disponible' };
      }
    }

    detailType = `AR ${nbJours} jours sans MAD`;
  }

  // Calculs finaux
  const prixBaseAvecHorsCadre = prixBase + supplementHorsCadre;
  const prixVehicule = Math.round(prixBaseAvecHorsCadre * coefficientVehicule);
  const supplementJoursAvecCoef = Math.round(supplementJours * coefficientVehicule);

  const prixAvantMajoration = prixVehicule + supplementJoursAvecCoef + infosTrajet.coutRelaisChauffeur;
  const prixFinal = Math.round(prixAvantMajoration * (1 + majorationAutoRegion));

  // Appliquer le nombre de cars
  const prixTotalMin = prixFinal * nombreCars;
  const prixTotalMax = prixTotalMin; // Pour l'instant min = max

  return {
    prixMin: prixTotalMin,
    prixMax: prixTotalMax,
    nbChauffeurs: infosTrajet.nbChauffeurs * nombreCars,
    nbCars: nombreCars,
    detailType,
  };
}

// =============================================
// HANDLER PRINCIPAL
// =============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json() as CalculRequest;

    // Validation basique
    if (!body.distanceKm || !body.typeService) {
      return new Response(
        JSON.stringify({ erreur: "Paramètres manquants (distanceKm, typeService)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const result = await calculerTarif(supabase, body);

    if ('erreur' in result) {
      return new Response(
        JSON.stringify({ erreur: result.erreur }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in calculate-price:", error);
    return new Response(
      JSON.stringify({ erreur: "Erreur serveur" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
