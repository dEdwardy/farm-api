import OSS from "npm:ali-oss@^6.20.0";

// 从环境变量中读取配置信息
const OSS_REGION = Deno.env.get("ALIYUN_OSS_REGION");
const OSS_ACCESS_KEY = Deno.env.get("ALIYUN_OSS_ACCESS_KEY_ID");
const OSS_ACCESS_SECRET = Deno.env.get("ALIYUN_OSS_SECRET");
const OSS_BUCKET = Deno.env.get("ALIYUN_OSS_BUCKET");
if (!OSS_REGION || !OSS_ACCESS_KEY || !OSS_ACCESS_SECRET || !OSS_BUCKET) {
  throw new Error("OSS_REGION, OSS_ACCESS_KEY, OSS_ACCESS_SECRET, and OSS_BUCKET are required environment variables");
}

// 初始化 OSS 客户端
export const ossClient = new OSS({
  region: OSS_REGION,
  accessKeyId: OSS_ACCESS_KEY,
  accessKeySecret: OSS_ACCESS_SECRET,
  bucket: OSS_BUCKET
});
