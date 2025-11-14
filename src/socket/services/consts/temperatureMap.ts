export const temperatureMap: Record<string, number> = {
  text: process.env.MODEL_TEMPERATURE_TEXT ? parseFloat(process.env.MODEL_TEMPERATURE_TEXT) : 1.3,
  pdf: process.env.MODEL_TEMPERATURE_PDF ? parseFloat(process.env.MODEL_TEMPERATURE_PDF) : 0.9,
  word: process.env.MODEL_TEMPERATURE_WORD ? parseFloat(process.env.MODEL_TEMPERATURE_WORD) : 1.2,
  excel: process.env.MODEL_TEMPERATURE_EXCEL
    ? parseFloat(process.env.MODEL_TEMPERATURE_EXCEL)
    : 1.3,
  powerpoint: process.env.MODEL_TEMPERATURE_POWERPOINT
    ? parseFloat(process.env.MODEL_TEMPERATURE_POWERPOINT)
    : 1.0,
  checklist: process.env.MODEL_TEMPERATURE_CHECKLIST
    ? parseFloat(process.env.MODEL_TEMPERATURE_CHECKLIST)
    : 0.8,
  business: process.env.MODEL_TEMPERATURE_BUSINESS
    ? parseFloat(process.env.MODEL_TEMPERATURE_BUSINESS)
    : 0.3,
  analytics: process.env.MODEL_TEMPERATURE_ANALYTICS
    ? parseFloat(process.env.MODEL_TEMPERATURE_ANALYTICS)
    : 0.4,
}
