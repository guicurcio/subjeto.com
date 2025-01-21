// app/fonts.ts
import localFont from 'next/font/local'

// ------------------
// Athletics
// ------------------
export const athletics = localFont({
  src: [
    {
      path: '../fonts/Athletics-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-athletics',
  display: 'swap',
})

// ------------------
// Geist Mono (Variable)
// ------------------
export const geistMonoVF = localFont({
  src: [
    {
      path: '../fonts/GeistMonoVF.woff',
      weight: '400', // might be “normal” for variable fonts
      style: 'normal',
    },
  ],
  variable: '--font-geistMonoVF',
  display: 'swap',
})

// ------------------
// Geist (Variable)
// ------------------
export const geistVF = localFont({
  src: [
    {
      path: '../fonts/GeistVF.woff',
      weight: '400', // might be “normal” for variable fonts
      style: 'normal',
    },
  ],
  variable: '--font-geistVF',
  display: 'swap',
})

// ------------------
// Gelica Lt (normal-300-100)
// ------------------
export const gelicaLt = localFont({
  src: [
    {
      path: '../fonts/Gelica Lt-normal-300-100.ttf',
      weight: '300',
      style: 'normal',
    },
  ],
  variable: '--font-gelicaLt',
  display: 'swap',
})

// ------------------
// Moderat
// ------------------
export const moderat = localFont({
  src: [
    {
      path: '../fonts/Moderat-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Moderat-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-moderat',
  display: 'swap',
})

// ------------------
// Neue Montreal
// ------------------
export const neueMontreal = localFont({
  src: [
    {
      path: '../fonts/Neue Montreal-normal-400-100.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/Neue Montreal Medium-normal-500-100.ttf',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-neueMontreal',
  display: 'swap',
})

// ------------------
// Source Sans Pro
// ------------------
export const sourceSansPro = localFont({
  src: [
    {
      path: '../fonts/SourceSansPro-Regular.otf',
      weight: '400',
      style: 'normal',
    },
  ],
  variable: '--font-sourceSansPro',
  display: 'swap',
})

// ------------------
// Space Grotesk
// ------------------
export const spaceGrotesk = localFont({
  src: [
    {
      path: '../fonts/SpaceGrotesk.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/SpaceGrotesk[wght].woff2',
      // For variable fonts, Next doesn't require you to label the entire range,
      // but you can simply treat it as normal or specify a range if needed:
      weight: 'normal',
      style: 'normal',
    },
    // {
    //   path: '../fonts/SpaceGroteskBold.woff2',
    //   weight: '700',
    //   style: 'normal',
    // },
  ],
  variable: '--font-spaceGrotesk',
  display: 'swap',
})

// ------------------
// Visuelt Pro
// ------------------
export const visueltPro = localFont({
  src: [
    {
      path: '../fonts/VisueltPro-Light.woff2',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../fonts/VisueltPro-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/VisueltPro-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../fonts/VisueltPro-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-visueltPro',
  display: 'swap',
})
