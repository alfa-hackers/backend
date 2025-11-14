export const presencePenaltyMap: Record<string, number> = {
  text: process.env.MODEL_PRESENCE_PENALTY_TEXT
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_TEXT)
    : 0,
  pdf: process.env.MODEL_PRESENCE_PENALTY_PDF
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_PDF)
    : 0,
  word: process.env.MODEL_PRESENCE_PENALTY_WORD
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_WORD)
    : 0,
  excel: process.env.MODEL_PRESENCE_PENALTY_EXCEL
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_EXCEL)
    : 0,
  powerpoint: process.env.MODEL_PRESENCE_PENALTY_POWERPOINT
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_POWERPOINT)
    : 0.2,
  checklist: process.env.MODEL_PRESENCE_PENALTY_CHECKLIST
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_CHECKLIST)
    : 0,
  business: process.env.MODEL_PRESENCE_PENALTY_BUSINESS
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_BUSINESS)
    : 0.1,
  analytics: process.env.MODEL_PRESENCE_PENALTY_ANALYTICS
    ? parseFloat(process.env.MODEL_PRESENCE_PENALTY_ANALYTICS)
    : 0.1,
}
