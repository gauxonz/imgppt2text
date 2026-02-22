var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
// 默认值（env未设置时使用）
var DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
var DEFAULT_MODEL = "qwen3.5-plus";
// 每日免费限额，默认100次，可通过环境变量 DAILY_LIMIT 覆盖
var DEFAULT_DAILY_LIMIT = 100;
var usageStorage = /* @__PURE__ */ new Map();
function checkAndIncrementUsage(deviceId, dailyLimit) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (!usageStorage.has(deviceId)) {
    usageStorage.set(deviceId, { date: today, count: 0 });
  }
  const userData = usageStorage.get(deviceId);
  if (userData.date !== today) {
    userData.date = today;
    userData.count = 0;
  }
  if (userData.count >= dailyLimit) {
    return { allowed: false, remaining: 0 };
  }
  userData.count++;
  return { allowed: true, remaining: dailyLimit - userData.count };
}
__name(checkAndIncrementUsage, "checkAndIncrementUsage");
async function callAPI(baseUrl, model, apiKey, messages, maxTokens = 2e3) {
  const url = baseUrl + "/chat/completions";
  const payload = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature: 0.1
  };
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.error) {
        return { success: false, error: `API错误: ${result.error.message || JSON.stringify(result)}` };
      }
      return { success: true, content: result.choices[0].message.content };
    } catch (e) {
      if (attempt === 2) {
        return { success: false, error: `请求失败: ${e.message}` };
      }
      await new Promise((r) => setTimeout(r, 2e3));
    }
  }
}
__name(callAPI, "callAPI");
async function processPptImage(imageBase64, pageNumber, apiKey, baseUrl, model) {
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `你是一个专业的PPT内容分析助手。请仔细观察这张PPT照片，将图片中PPT上的内容按照以下格式输出：

## 第${pageNumber}页

### 主要标题
[识别出的主要标题或主题]

### 关键内容
[列举主要的文字内容，保持原有的结构和逻辑]

### 要点总结
- [要点1]
- [要点2]
- [要点3]

请确保：
1. 准确识别图片中的所有可见文字
2. 保持原有的层次结构和逻辑关系
3. 如果有图表或示意图，请描述其主要信息
4. 忽略不重要的装饰性元素`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    }
  ];
  const result = await callAPI(baseUrl, model, apiKey, messages, 2e3);
  return result;
}
__name(processPptImage, "processPptImage");
async function recognizeTitle(imageBase64, theme, apiKey, baseUrl, model) {
  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: `这是一场关于"${theme}"的演讲。请仔细看这张PPT照片，识别出演讲人的姓名和演讲标题。若你无法识别演讲人姓名和演讲标题，请输出“未知”。

请直接输出以下格式（不要输出其他内容）：
演讲人：[姓名]
演讲标题：[标题]`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
    }
  ];
  const result = await callAPI(baseUrl, model, apiKey, messages, 500);
  if (result.success) {
    const content = result.content;
    let name = "";
    let title = "";
    const nameMatch = content.match(/演讲人[：:]\s*(.+)/);
    const titleMatch = content.match(/演讲标题[：:]\s*(.+)/);
    if (nameMatch) name = nameMatch[1].trim();
    if (titleMatch) title = titleMatch[1].trim();
    return { success: true, name, title };
  }
  return { success: false, name: "", title: "" };
}
__name(recognizeTitle, "recognizeTitle");
async function generateSummary(content, apiKey, baseUrl, model) {
  const messages = [
    {
      role: "user",
      content: `请为以下PPT内容生成一个综合总结：

${content}

请按照以下格式输出：
# 会议总结

## 主要主题
## 核心观点
## 重要信息
`
    }
  ];
  return await callAPI(baseUrl, model, apiKey, messages, 1500);
}
__name(generateSummary, "generateSummary");
function makeResponse(data, status = 200) {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
  return new Response(JSON.stringify(data), { status, headers });
}
__name(makeResponse, "makeResponse");
async function handleRequest(request, env) {
  if (request.method === "OPTIONS") {
    return new Response("", { status: 204, headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    } });
  }
  if (request.method !== "POST") {
    return makeResponse({ success: false, error: "只支持POST请求" }, 405);
  }
  let data;
  try {
    data = await request.json();
  } catch {
    return makeResponse({ success: false, error: "解析请求失败" }, 400);
  }
  const action = data.action || "check_usage";
  const userApiKey = data.apiKey || "";
  const userBaseUrl = data.baseUrl || env.DEFAULT_BASE_URL || DEFAULT_BASE_URL;
  const userModel = data.model || env.DEFAULT_MODEL || DEFAULT_MODEL;
  const useCustomApiKey = userApiKey.length > 0;

  // 每日限额从环境变量读取
  const dailyLimit = parseInt(env.DAILY_LIMIT) || DEFAULT_DAILY_LIMIT;

  // 管理员密码验证
  const adminPassword = data.adminPassword || "";
  const envAdminPassword = env.ADMIN_PASSWORD;
  const isDebugMode = adminPassword && envAdminPassword && adminPassword === envAdminPassword;
  // 优先使用前端传入的 deviceId，否则降级使用 IP
  const deviceId = data.deviceId || request.headers.get("CF-Connecting-IP") || "unknown";
  let remaining = null;
  if (!useCustomApiKey && !isDebugMode) {
    const result = checkAndIncrementUsage(deviceId, dailyLimit);
    if (!result.allowed) {
      return makeResponse({
        success: false,
        error: `今日次数已用完（${dailyLimit}次/天）`,
        remaining: 0,
        limit: dailyLimit
      }, 403);
    }
    remaining = result.remaining;
  }

  // 验证管理员密码
  if (action === "verify_admin") {
    const envAdminPassword = env.ADMIN_PASSWORD;
    console.log("Verify admin, input:", adminPassword, "env:", envAdminPassword);
    const valid = envAdminPassword && adminPassword === envAdminPassword;
    return makeResponse({ success: true, valid });
  }

  const apiKeyToUse = userApiKey || env.DEFAULT_API_KEY || "";

  // 检查是否有可用的API Key
  if (!apiKeyToUse && !useCustomApiKey && !isDebugMode) {
    return makeResponse({ success: false, error: "未配置API Key，请在设置中填写" }, 400);
  }

  if (action === "check_usage") {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const userData = usageStorage.get(deviceId);
    const count = userData && userData.date === today ? userData.count : 0;
    return makeResponse({
      success: true,
      remaining: isDebugMode ? 9999 : Math.max(0, dailyLimit - count),
      limit: dailyLimit,
      debugMode: isDebugMode
    });
  }
  if (action === "process") {
    const imageBase64 = data.image || "";
    const pageNumber = data.pageNumber || 1;
    const theme = data.theme || "";
    if (!imageBase64) {
      return makeResponse({ success: false, error: "缺少图片数据" }, 400);
    }
    const result = await processPptImage(imageBase64, pageNumber, apiKeyToUse, userBaseUrl, userModel);
    if (remaining !== null) {
      result.remaining = remaining;
      result.limit = dailyLimit;
    }
    return makeResponse(result);
  }
  if (action === "recognize_title") {
    const imageBase64 = data.image || "";
    const theme = data.theme || "";
    if (!imageBase64) {
      return makeResponse({ success: false, error: "缺少图片数据" }, 400);
    }
    const result = await recognizeTitle(imageBase64, theme, apiKeyToUse, userBaseUrl, userModel);
    return makeResponse(result);
  }
  if (action === "summary") {
    const content = data.content || "";
    const result = await generateSummary(content, apiKeyToUse, userBaseUrl, userModel);
    if (remaining !== null) {
      result.remaining = remaining;
      result.limit = dailyLimit;
    }
    return makeResponse(result);
  }
  return makeResponse({ success: false, error: `未知的操作: ${action}` }, 400);
}
__name(handleRequest, "handleRequest");
var worker_default = {
  async fetch(request, env) {
    return handleRequest(request, env);
  }
};
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
