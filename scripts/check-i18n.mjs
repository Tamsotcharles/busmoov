#!/usr/bin/env node
/**
 * Verifie que les 4 langues exposent exactement les memes cles.
 *
 * Une cle ajoutee en francais et oubliee ailleurs n'echoue nulle part au
 * build : i18next affiche simplement l'identifiant brut au client
 * ("mesDevis.errors.alreadySigned") sur le site espagnol ou allemand.
 * Ce controle rend l'oubli bloquant.
 *
 * Usage : node scripts/check-i18n.mjs
 */
import { readFileSync, existsSync } from 'node:fs'

const REFERENCE = 'fr'
const LANGUAGES = ['fr', 'es', 'de', 'en']
const NAMESPACES = ['common', 'forms', 'pdf']

/** Aplatit un objet imbrique en chemins pointes : { a: { b: 1 } } -> ["a.b"] */
function flatten(value, prefix = '') {
  return Object.entries(value).flatMap(([key, child]) =>
    child && typeof child === 'object' && !Array.isArray(child)
      ? flatten(child, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  )
}

function load(lang, namespace) {
  const path = `src/locales/${lang}/${namespace}.json`
  if (!existsSync(path)) throw new Error(`fichier manquant : ${path}`)
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    throw new Error(`JSON invalide dans ${path} : ${error.message}`)
  }
}

let failures = 0

for (const namespace of NAMESPACES) {
  const reference = new Set(flatten(load(REFERENCE, namespace)))
  console.log(`\n${namespace}.json — ${reference.size} cles de reference (${REFERENCE})`)

  for (const lang of LANGUAGES.filter((l) => l !== REFERENCE)) {
    const keys = new Set(flatten(load(lang, namespace)))
    const missing = [...reference].filter((k) => !keys.has(k))
    const extra = [...keys].filter((k) => !reference.has(k))

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  OK    ${lang} — ${keys.size} cles`)
      continue
    }

    failures++
    console.log(`  ECHEC ${lang} — ${keys.size} cles`)
    if (missing.length) {
      console.log(`        ${missing.length} manquante(s) : ${missing.slice(0, 10).join(', ')}${missing.length > 10 ? ', ...' : ''}`)
    }
    if (extra.length) {
      console.log(`        ${extra.length} en trop : ${extra.slice(0, 10).join(', ')}${extra.length > 10 ? ', ...' : ''}`)
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} langue(s) desynchronisee(s). Alignez les cles sur ${REFERENCE}.`)
  process.exit(1)
}
console.log('\nToutes les langues sont alignees.')
