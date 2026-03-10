import { ossClient } from '../../_shared/ossClient.ts';

// 允许的文件类型白名单
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation"
];

/**
 * 生成唯一的 objectKey
 * @param originalName 原始文件名
 * @returns 唯一的 objectKey
 */
export function generateObjectKey(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const fileExtension = originalName.split(".").pop() || "";
  return `farm-files/${timestamp}-${randomString}${fileExtension ? `.${fileExtension}` : ""}`;
}

/**
 * 生成 OSS 上传预签名 URL
 * @param fileName 文件名
 * @param fileType 文件类型
 * @returns 预签名 URL 和 objectKey
 */
export async function generatePresignedUrl(fileName: string, fileType: string) {
  // 生成唯一的 objectKey
  const objectKey = generateObjectKey(fileName);

  // 生成预签名 URL
  const uploadUrl = await ossClient.signatureUrl(objectKey, {
    method: "PUT",
    headers: {
      "Content-Type": fileType
    },
    expires: 3600 // 1小时过期
  });

  return {
    uploadUrl,
    objectKey,
    originalName: fileName
  };
}