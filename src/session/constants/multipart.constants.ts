export const multipartLimits = {
  fileSize: parseInt(process.env.MULTIPART_FILE_SIZE || '104857600'),
  fieldSize: parseInt(process.env.MULTIPART_FIELD_SIZE || '2097152'),
  parts: parseInt(process.env.MULTIPART_PARTS || '100'),
  files: parseInt(process.env.MULTIPART_FILES || '5'),
  fieldNameSize: parseInt(process.env.MULTIPART_FIELD_NAME_SIZE || '1000'),
}
