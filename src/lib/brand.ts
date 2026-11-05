// Regency brand marks, from the Regency website (public/brand). Width and height are the SVG
// viewBox sizes, so next/image reserves the right aspect ratio; CSS sets the rendered size.

export type BrandMark = { src: string; width: number; height: number }

/** The crest alone: square spots (app rail, phone pill, logo tiles). */
export const BRAND_CREST: BrandMark = { src: "/brand/regency-crest.svg", width: 224, height: 235 }

/** Crest with the REGENCY wordmark: wide spots (page headers, the invoice). */
export const BRAND_LOGO: BrandMark = { src: "/brand/regency-logo.svg", width: 701, height: 235 }
