export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const formatBytesMB = (bytes: number): string => `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
