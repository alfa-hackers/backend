export const topPMap: Record<string, number> = {
  text: process.env.MODEL_TOP_P_TEXT ? parseFloat(process.env.MODEL_TOP_P_TEXT) : 1,
  pdf: process.env.MODEL_TOP_P_PDF ? parseFloat(process.env.MODEL_TOP_P_PDF) : 1,
  word: process.env.MODEL_TOP_P_WORD ? parseFloat(process.env.MODEL_TOP_P_WORD) : 1,
  excel: process.env.MODEL_TOP_P_EXCEL ? parseFloat(process.env.MODEL_TOP_P_EXCEL) : 1,
  powerpoint: process.env.MODEL_TOP_P_POWERPOINT
    ? parseFloat(process.env.MODEL_TOP_P_POWERPOINT)
    : 1,
  checklist: process.env.MODEL_TOP_P_CHECKLIST ? parseFloat(process.env.MODEL_TOP_P_CHECKLIST) : 1,
  business: process.env.MODEL_TOP_P_BUSINESS ? parseFloat(process.env.MODEL_TOP_P_BUSINESS) : 0.85,
  analytics: process.env.MODEL_TOP_P_ANALYTICS
    ? parseFloat(process.env.MODEL_TOP_P_ANALYTICS)
    : 0.9,
}
