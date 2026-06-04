// Two languages, one source of truth. The language lives in Settings (default
// Portuguese) and flows through React context; every component pulls its copy
// from STR via useT(). Time-words come from timeModel (pt) / timeWordsEn (en).

import { createContext, useContext } from 'react'
import type { Level } from './quiz'
import type { ZoneId } from './park'

export type Lang = 'pt' | 'en'

export const LangContext = createContext<Lang>('pt')
export const useLang = (): Lang => useContext(LangContext)

export interface UIStrings {
  // NavBar
  navLearn: string
  navPlay: string
  navQuiz: string
  navMissions: string
  navSettingsAria: string
  brandAria: string
  starsAria: (n: number) => string
  playingAria: (min: number) => string
  mainNavAria: string
  // FreePlay
  instruction: string
  snapTitle: string
  snapAria: string
  snapStepAria: (s: number) => string
  now: string
  nowAria: string
  morning: string
  evening: string
  dayNightToMorningAria: string
  dayNightToEveningAria: string
  listen: string
  listenAria: (text: string) => string
  legendHours: string
  legendMinutes: string
  // Learn
  stepOf: (i: number, n: number) => string
  doneChip: string
  back: string
  next: string
  finalTitle: string
  finalText: string
  finalCta: string
  // Quiz
  whatTime: string
  whichClock: string
  youGot: (score: number, n: number) => string
  scoreAria: (score: number, n: number) => string
  repeat: string
  nextLevel: string
  levels: string
  optionAria: (i: number) => string
  abandonQuizAria: string
  questionCounter: (i: number, n: number) => string
  missionCounter: (i: number, n: number) => string
  helpAria: string
  hintDismissAria: string
  nextHint: string
  restartRoundQ: string
  exitRoundQ: string
  confirmRestart: string
  confirmExit: string
  keepPlaying: string
  help: string
  moreHelp: string
  hintAnalog: string
  hintDigital: (h: number) => string
  // LevelMap
  pickLevel: string
  with24h: string
  levelWord: string
  levelLabel: (level: Level) => string
  levelPlayAriaLocked: string
  // Missions
  missionsTitle: string
  missionsPitch: string
  missionsMissing: (n: number) => string
  missionsEarnHint: string
  missionsUnlock: (cost: number) => string
  anotherRound: string
  clockShowsNow: string
  minSuffix: string
  hintWedge: string
  hintLeave: (time: string) => string
  abandonMissionsAria: string
  // Parque do Cloki
  navPark: string
  parkTitle: string
  zoneName: (z: ZoneId) => string
  zoneTagline: (z: ZoneId) => string
  pronto: string
  almostTryAgain: string
  setHint: (h: number, mPos: number) => string
  backToPark: string
  casaPick: string
  storyExitQ: string
  storyEndTitle: string
  storyEndText: string
  zoneLevelAria: (zone: string, level: number) => string
  // Settings
  languageTitle: string
  themeTitle: string
  themeSky: string
  themeSimple: string
  snapSettingTitle: string
  snapLabels: Record<15 | 5 | 1, string>
  helpersTitle: string
  toggleWords: string
  toggleVoice: string
  toggleLegend: string
  toggleSeconds: string
  toggle24h: string
  toggleMinuteHelp: string
  toggleConfirmGlow: string
  areasTitle: string
  areasHint: string
  voiceTitle: string
  voiceAuto: string
  voiceTestAria: string
  voiceSample: string
  speedSlow: string
  speedNormal: string
  speedFast: string
  resetTitle: string
  resetButton: string
  resetConfirm: string
  // Break nudge
  breakTitle: (min: number) => string
  breakText: string
  breakOk: string
  breakAria: string
}

const LEVEL_LABELS_PT: Record<Level, string> = {
  1: 'Horas certas', 2: 'Meias horas', 3: 'Quartos de hora', 4: 'Cinco em cinco', 5: 'Minuto a minuto',
  6: 'Horas certas · 24h', 7: 'Meias horas · 24h', 8: 'Quartos de hora · 24h', 9: 'Cinco em cinco · 24h', 10: 'Minuto a minuto · 24h',
}
const LEVEL_LABELS_EN: Record<Level, string> = {
  1: "O'clock", 2: 'Half hours', 3: 'Quarter hours', 4: 'Five by five', 5: 'To the minute',
  6: "O'clock · 24h", 7: 'Half hours · 24h', 8: 'Quarter hours · 24h', 9: 'Five by five · 24h', 10: 'To the minute · 24h',
}

export const STR: Record<Lang, UIStrings> = {
  pt: {
    navLearn: 'Aprender',
    navPlay: 'Brincar',
    navQuiz: 'Quiz',
    navMissions: 'Missões',
    navSettingsAria: 'Definições',
    brandAria: 'Ir para Brincar',
    starsAria: (n) => `${n} estrelas`,
    playingAria: (min) => `A brincar há ${min} minutos`,
    mainNavAria: 'Navegação principal',
    instruction: '👆 Arrasta os ponteiros ou toca nos números para mudares a hora.',
    snapTitle: 'Saltos dos minutos',
    snapAria: 'Precisão dos minutos',
    snapStepAria: (s) => `Saltos de ${s} minuto${s === 1 ? '' : 's'}`,
    now: '🕒 Agora',
    nowAria: 'Acertar o relógio pela hora atual',
    morning: '☀️ Manhã',
    evening: '🌙 Tarde/Noite',
    dayNightToMorningAria: 'Tarde/noite — tocar para manhã',
    dayNightToEveningAria: 'Manhã — tocar para tarde/noite',
    listen: '🔊 Ouvir',
    listenAria: (text) => `Ouvir: ${text}`,
    legendHours: 'horas',
    legendMinutes: 'minutos',
    stepOf: (i, n) => `Passo ${i} de ${n}`,
    doneChip: 'Concluído!',
    back: '◀ Voltar',
    next: 'Seguinte ▶',
    finalTitle: 'Já sabes o básico!',
    finalText: 'Agora é a tua vez de mexer no relógio.',
    finalCta: 'Vamos brincar! 🕐',
    whatTime: 'Que horas são?',
    whichClock: 'Qual relógio mostra esta hora?',
    youGot: (s, n) => `Acertaste ${s}/${n}!`,
    scoreAria: (s, n) => `${s} de ${n}`,
    repeat: '🔁 Repetir',
    nextLevel: 'Próximo nível →',
    levels: 'Níveis',
    optionAria: (i) => `Opção ${i}`,
    abandonQuizAria: 'Abandonar a ronda e voltar aos níveis',
    questionCounter: (i, n) => `Pergunta ${i}/${n}`,
    missionCounter: (i, n) => `Missão ${i}/${n}`,
    helpAria: 'Pedir uma pista',
    hintDismissAria: 'Fechar a pista',
    nextHint: '🃏 Próxima pista',
    restartRoundQ: 'Queres começar uma ronda nova?',
    exitRoundQ: 'Queres sair desta ronda e voltar aos níveis?',
    confirmRestart: 'Sim, ronda nova',
    confirmExit: 'Sim, sair',
    keepPlaying: 'Continuar a jogar',
    help: '💡 Ajuda',
    moreHelp: '💡 Mais ajuda',
    hintAnalog: 'O ponteiro pequeno e vermelho diz a hora. O grande e azul conta os minutos, de 5 em 5.',
    hintDigital: (h) => `Procura o relógio com o ponteiro pequeno e vermelho perto do ${h}.`,
    pickLevel: 'Escolhe um nível',
    with24h: 'Com 24 horas',
    levelWord: 'Nível',
    levelLabel: (l) => LEVEL_LABELS_PT[l],
    levelPlayAriaLocked: 'Nível bloqueado',
    missionsTitle: 'Missões do Tempo',
    missionsPitch: 'Problemas de tempo da vida real: a que horas saímos para a escola? Quantos minutos falta esperar até o Zoo abrir?',
    missionsMissing: (n) => `Faltam ${n} ⭐ para desbloquear`,
    missionsEarnHint: 'Ganha estrelas no Quiz!',
    missionsUnlock: (c) => `Desbloquear · ${c} ⭐`,
    anotherRound: '🔁 Outra ronda',
    clockShowsNow: '(O relógio mostra as horas de agora.)',
    minSuffix: ' min',
    hintWedge: 'Apareceu uma fatia vermelha no relógio: conta os minutos dela de 5 em 5.',
    hintLeave: (time) => `Anda para trás a partir das ${time} — a fatia vermelha mostra o caminho. Conta de 5 em 5.`,
    abandonMissionsAria: 'Abandonar a ronda e começar outra',
    navPark: 'Parque',
    parkTitle: 'Parque do Cloki',
    zoneName: (z) => ({ estacao: 'Estação', zoo: 'Zoo', cinema: 'Cinema', oficina: 'Oficina', casa: 'Casa do Cloki' })[z],
    zoneTagline: (z) =>
      ({
        estacao: 'Acerta o relógio!',
        zoo: 'Quanto tempo falta?',
        cinema: 'Sai a tempo!',
        oficina: 'Conserta o relógio maluco!',
        casa: 'Vive um dia com o Cloki',
      })[z],
    pronto: '✅ Pronto!',
    almostTryAgain: 'Quase! Olha bem e tenta outra vez.',
    setHint: (h, mPos) => `Pista: ponteiro pequeno e vermelho perto do ${h}; ponteiro grande e azul no ${mPos}.`,
    backToPark: '← Parque',
    casaPick: 'Escolhe um dia para viver com o Cloki!',
    storyExitQ: 'Queres sair da história?',
    storyEndTitle: 'Fim do dia! 🌙',
    storyEndText: 'O Cloki viveu o dia todo contigo. Obrigado!',
    zoneLevelAria: (zone, level) => `Jogar ${zone}, nível ${level}`,
    languageTitle: 'Língua',
    themeTitle: 'Tema',
    themeSky: '🌅 Com céu',
    themeSimple: '⬜ Simples',
    snapSettingTitle: 'Precisão dos minutos',
    snapLabels: { 15: 'Quartos (15 min)', 5: 'Cinco em cinco', 1: 'Minuto a minuto' },
    helpersTitle: 'Ajudas',
    toggleWords: 'Mostrar horas por palavras',
    toggleVoice: 'Botão de voz',
    toggleLegend: 'Legenda dos ponteiros',
    toggleSeconds: 'Mostrar segundos',
    toggle24h: 'Mostrar números 24h',
    toggleMinuteHelp: 'Mostrar minutos junto aos números',
    toggleConfirmGlow: 'Brilho verde quando o relógio fica certo (Parque)',
    areasTitle: 'Áreas da app',
    areasHint: 'Para algo mais simples, desliga áreas. Aprender e Brincar estão sempre ativos.',
    voiceTitle: 'Voz',
    voiceAuto: 'Automática (a melhor disponível)',
    voiceTestAria: 'Testar a voz',
    voiceSample: 'Olá! Eu leio as horas contigo. São três e meia.',
    speedSlow: '🐢 Devagar',
    speedNormal: 'Normal',
    speedFast: '🐇 Rápido',
    resetTitle: 'Recomeçar',
    resetButton: '🗑️ Apagar estrelas e recomeçar',
    resetConfirm: 'Apagar todas as estrelas e recomeçar do início?',
    breakTitle: (min) => `Já brincas há ${min} minutos!`,
    breakText: 'Que tal uma pausa para descansar os olhos e esticar as pernas?',
    breakOk: 'Está bem! 👍',
    breakAria: 'Sugestão de pausa',
  },
  en: {
    navLearn: 'Learn',
    navPlay: 'Play',
    navQuiz: 'Quiz',
    navMissions: 'Missions',
    navSettingsAria: 'Settings',
    brandAria: 'Go to Play',
    starsAria: (n) => `${n} stars`,
    playingAria: (min) => `Playing for ${min} minutes`,
    mainNavAria: 'Main navigation',
    instruction: '👆 Drag the hands or tap the numbers to change the time.',
    snapTitle: 'Minute jumps',
    snapAria: 'Minute precision',
    snapStepAria: (s) => `Jumps of ${s} minute${s === 1 ? '' : 's'}`,
    now: '🕒 Now',
    nowAria: 'Set the clock to the current time',
    morning: '☀️ Morning',
    evening: '🌙 Afternoon/Night',
    dayNightToMorningAria: 'Afternoon/night — tap for morning',
    dayNightToEveningAria: 'Morning — tap for afternoon/night',
    listen: '🔊 Listen',
    listenAria: (text) => `Listen: ${text}`,
    legendHours: 'hours',
    legendMinutes: 'minutes',
    stepOf: (i, n) => `Step ${i} of ${n}`,
    doneChip: 'Done!',
    back: '◀ Back',
    next: 'Next ▶',
    finalTitle: 'You know the basics!',
    finalText: 'Now it’s your turn to play with the clock.',
    finalCta: 'Let’s play! 🕐',
    whatTime: 'What time is it?',
    whichClock: 'Which clock shows this time?',
    youGot: (s, n) => `You got ${s}/${n}!`,
    scoreAria: (s, n) => `${s} out of ${n}`,
    repeat: '🔁 Repeat',
    nextLevel: 'Next level →',
    levels: 'Levels',
    optionAria: (i) => `Option ${i}`,
    abandonQuizAria: 'Abandon the round and go back to levels',
    questionCounter: (i, n) => `Question ${i}/${n}`,
    missionCounter: (i, n) => `Mission ${i}/${n}`,
    helpAria: 'Ask for a hint',
    hintDismissAria: 'Close the hint',
    nextHint: '🃏 Next hint',
    restartRoundQ: 'Do you want to start a new round?',
    exitRoundQ: 'Do you want to leave this round and go back to levels?',
    confirmRestart: 'Yes, new round',
    confirmExit: 'Yes, leave',
    keepPlaying: 'Keep playing',
    help: '💡 Help',
    moreHelp: '💡 More help',
    hintAnalog: 'The small red hand tells the hour. The big blue one counts minutes, five by five.',
    hintDigital: (h) => `Look for the clock with the small red hand near the ${h}.`,
    pickLevel: 'Pick a level',
    with24h: 'With 24-hour time',
    levelWord: 'Level',
    levelLabel: (l) => LEVEL_LABELS_EN[l],
    levelPlayAriaLocked: 'Level locked',
    missionsTitle: 'Time Missions',
    missionsPitch: 'Real-life time problems: what time do we leave for school? How many minutes until the Zoo opens?',
    missionsMissing: (n) => `${n} ⭐ to go to unlock`,
    missionsEarnHint: 'Earn stars in the Quiz!',
    missionsUnlock: (c) => `Unlock · ${c} ⭐`,
    anotherRound: '🔁 Another round',
    clockShowsNow: '(The clock shows the time right now.)',
    minSuffix: ' min',
    hintWedge: 'A red slice appeared on the clock: count its minutes five by five.',
    hintLeave: (time) => `Walk backwards from ${time} — the red slice shows the way. Count five by five.`,
    abandonMissionsAria: 'Abandon the round and start a new one',
    navPark: 'Park',
    parkTitle: 'Cloki Park',
    zoneName: (z) => ({ estacao: 'Station', zoo: 'Zoo', cinema: 'Cinema', oficina: 'Workshop', casa: "Cloki's House" })[z],
    zoneTagline: (z) =>
      ({
        estacao: 'Set the clock!',
        zoo: 'How long to go?',
        cinema: 'Leave on time!',
        oficina: 'Fix the crazy clock!',
        casa: 'Live a day with Cloki',
      })[z],
    pronto: '✅ Done!',
    almostTryAgain: 'Almost! Look closely and try again.',
    setHint: (h, mPos) => `Hint: small red hand near the ${h}; big blue hand on the ${mPos}.`,
    backToPark: '← Park',
    casaPick: 'Pick a day to live with Cloki!',
    storyExitQ: 'Do you want to leave the story?',
    storyEndTitle: 'The day is over! 🌙',
    storyEndText: 'Cloki lived the whole day with you. Thank you!',
    zoneLevelAria: (zone, level) => `Play ${zone}, level ${level}`,
    languageTitle: 'Language',
    themeTitle: 'Theme',
    themeSky: '🌅 With sky',
    themeSimple: '⬜ Simple',
    snapSettingTitle: 'Minute precision',
    snapLabels: { 15: 'Quarters (15 min)', 5: 'Five by five', 1: 'To the minute' },
    helpersTitle: 'Helpers',
    toggleWords: 'Show time in words',
    toggleVoice: 'Voice button',
    toggleLegend: 'Hands legend',
    toggleSeconds: 'Show seconds',
    toggle24h: 'Show 24h numbers',
    toggleMinuteHelp: 'Show minutes next to the numbers',
    toggleConfirmGlow: 'Green glow when the clock is right (Park)',
    areasTitle: 'App areas',
    areasHint: 'For something simpler, switch areas off. Learn and Play are always on.',
    voiceTitle: 'Voice',
    voiceAuto: 'Automatic (best available)',
    voiceTestAria: 'Test the voice',
    voiceSample: 'Hi! I read the time with you. It is half past three.',
    speedSlow: '🐢 Slow',
    speedNormal: 'Normal',
    speedFast: '🐇 Fast',
    resetTitle: 'Start over',
    resetButton: '🗑️ Erase stars and start over',
    resetConfirm: 'Erase all stars and start from the beginning?',
    breakTitle: (min) => `You’ve been playing for ${min} minutes!`,
    breakText: 'How about a break to rest your eyes and stretch your legs?',
    breakOk: 'Okay! 👍',
    breakAria: 'Break suggestion',
  },
}

export function useT(): UIStrings {
  return STR[useLang()]
}
