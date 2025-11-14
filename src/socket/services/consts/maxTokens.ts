export const maxTokensMap: Record<string, number> = {
  text: process.env.MODEL_MAX_TOKENS_TEXT ? parseInt(process.env.MODEL_MAX_TOKENS_TEXT) : 1000,
  pdf: process.env.MODEL_MAX_TOKENS_PDF ? parseInt(process.env.MODEL_MAX_TOKENS_PDF) : 2000,
  word: process.env.MODEL_MAX_TOKENS_WORD ? parseInt(process.env.MODEL_MAX_TOKENS_WORD) : 2000,
  excel: process.env.MODEL_MAX_TOKENS_EXCEL ? parseInt(process.env.MODEL_MAX_TOKENS_EXCEL) : 1500,
  powerpoint: process.env.MODEL_MAX_TOKENS_POWERPOINT
    ? parseInt(process.env.MODEL_MAX_TOKENS_POWERPOINT)
    : 15000,
  checklist: process.env.MODEL_MAX_TOKENS_CHECKLIST
    ? parseInt(process.env.MODEL_MAX_TOKENS_CHECKLIST)
    : 1000,
  business: process.env.MODEL_MAX_TOKENS_BUSINESS
    ? parseInt(process.env.MODEL_MAX_TOKENS_BUSINESS)
    : 1200,
  analytics: process.env.MODEL_MAX_TOKENS_ANALYTICS
    ? parseInt(process.env.MODEL_MAX_TOKENS_ANALYTICS)
    : 2500,
}
