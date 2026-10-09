/**
 * Whether Aligned is selling anything right now.
 *
 * Off at launch: no feature checks for a subscription yet, so a purchase
 * would unlock nothing. When Premium gating and Apple in-app purchase ship
 * together (App Store Guideline 3.1.3(b) requires the in-app option once a
 * web purchase unlocks anything in the app), flip this to true and restore
 * the pricing copy on the landing page and welcome screen.
 */
export const SALES_OPEN = false;
