export const stopSequencesMap: Record<string, string[]> = {
  text: process.env.MODEL_STOP_SEQUENCES_TEXT
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_TEXT)
    : undefined,
  pdf: process.env.MODEL_STOP_SEQUENCES_PDF
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_PDF)
    : undefined,
  word: process.env.MODEL_STOP_SEQUENCES_WORD
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_WORD)
    : undefined,
  excel: process.env.MODEL_STOP_SEQUENCES_EXCEL
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_EXCEL)
    : undefined,
  powerpoint: process.env.MODEL_STOP_SEQUENCES_POWERPOINT
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_POWERPOINT)
    : undefined,
  checklist: process.env.MODEL_STOP_SEQUENCES_CHECKLIST
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_CHECKLIST)
    : undefined,
  business: process.env.MODEL_STOP_SEQUENCES_BUSINESS
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_BUSINESS)
    : undefined,
  analytics: process.env.MODEL_STOP_SEQUENCES_ANALYTICS
    ? JSON.parse(process.env.MODEL_STOP_SEQUENCES_ANALYTICS)
    : undefined,
}
