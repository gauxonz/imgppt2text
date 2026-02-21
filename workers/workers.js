var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
// 默认值（env未设置时使用）
var DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
var DEFAULT_MODEL = "qwen3.5-plus";
// DEFAULT_API_KEY 不再硬编码，必须通过环境变量设置
var DAILY_LIMIT = 100;
var usageStorage = /* @__PURE__ */ new Map();
function checkAndIncrementUsage(clientIp) {
  const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  if (!usageStorage.has(clientIp)) {
    usageStorage.set(clientIp, { date: today, count: 0 });
  }
  const userData = usageStorage.get(clientIp);
  if (userData.date !== today) {
    userData.date = today;
    userData.count = 0;
  }
  if (userData.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }
  userData.count++;
  return { allowed: true, remaining: DAILY_LIMIT - userData.count };
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
        return { success: false, error: `API\u9519\u8BEF: ${result.error.message || JSON.stringify(result)}` };
      }
      return { success: true, content: result.choices[0].message.content };
    } catch (e) {
      if (attempt === 2) {
        return { success: false, error: `\u8BF7\u6C42\u5931\u8D25: ${e.message}` };
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
          text: `\u4F60\u662F\u4E00\u4E2A\u4E13\u4E1A\u7684PPT\u5185\u5BB9\u5206\u6790\u52A9\u624B\u3002\u8BF7\u4ED4\u7EC6\u5206\u6790\u8FD9\u5F20PPT\u7167\u7247\uFF0C\u5E76\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F93\u51FA\uFF1A

## \u7B2CX\u9875

### \u4E3B\u8981\u6807\u9898
[\u8BC6\u522B\u51FA\u7684\u4E3B\u8981\u6807\u9898\u6216\u4E3B\u9898]

### \u5173\u952E\u5185\u5BB9
[\u5217\u4E3E\u4E3B\u8981\u7684\u6587\u5B57\u5185\u5BB9\uFF0C\u4FDD\u6301\u539F\u6709\u7684\u7ED3\u6784\u548C\u903B\u8F91]

### \u8981\u70B9\u603B\u7ED3
- [\u8981\u70B91]
- [\u8981\u70B92]
- [\u8981\u70B93]

\u8BF7\u786E\u4FDD\uFF1A
1. \u51C6\u786E\u8BC6\u522B\u56FE\u7247\u4E2D\u7684\u6240\u6709\u53EF\u89C1\u6587\u5B57
2. \u4FDD\u6301\u539F\u6709\u7684\u5C42\u6B21\u7ED3\u6784\u548C\u903B\u8F91\u5173\u7CFB
3. \u5982\u679C\u6709\u56FE\u8868\u6216\u793A\u610F\u56FE\uFF0C\u8BF7\u63CF\u8FF0\u5176\u4E3B\u8981\u4FE1\u606F`
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
  if (result.success) {
    result.content = result.content.replace(/第X页/g, `\u7B2C${pageNumber}\u9875`);
  }
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
          text: `\u8FD9\u662F\u4E00\u573A\u5173\u4E8E"${theme}"\u7684\u6F14\u8BB2\u3002\u8BF7\u4ED4\u7EC6\u770B\u8FD9\u5F20PPT\u7167\u7247\uFF0C\u8BC6\u522B\u51FA\u6F14\u8BB2\u4EBA\u7684\u59D3\u540D\u548C\u6F14\u8BB2\u6807\u9898\u3002

\u8BF7\u76F4\u63A5\u8F93\u51FA\u4EE5\u4E0B\u683C\u5F0F\uFF08\u4E0D\u8981\u8F93\u51FA\u5176\u4ED6\u5185\u5BB9\uFF09\uFF1A
\u6F14\u8BB2\u4EBA\uFF1A[\u59D3\u540D]
\u6F14\u8BB2\u6807\u9898\uFF1A[\u6807\u9898]`
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
      content: `\u8BF7\u4E3A\u4EE5\u4E0BPPT\u5185\u5BB9\u751F\u6210\u4E00\u4E2A\u7EFC\u5408\u603B\u7ED3\uFF1A

${content}

\u8BF7\u6309\u7167\u4EE5\u4E0B\u683C\u5F0F\u8F93\u51FA\uFF1A
# \u4F1A\u8BAE\u603B\u7ED3

## \u4E3B\u8981\u4E3B\u9898
## \u6838\u5FC3\u89C2\u70B9
## \u91CD\u8981\u4FE1\u606F
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
    return makeResponse({ success: false, error: "\u53EA\u652F\u6301POST\u8BF7\u6C42" }, 405);
  }
  let data;
  try {
    data = await request.json();
  } catch {
    return makeResponse({ success: false, error: "\u89E3\u6790\u8BF7\u6C42\u5931\u8D25" }, 400);
  }
  const action = data.action || "check_usage";
  const userApiKey = data.apiKey || "";
  const userBaseUrl = data.baseUrl || env.DEFAULT_BASE_URL || DEFAULT_BASE_URL;
  const userModel = data.model || env.DEFAULT_MODEL || DEFAULT_MODEL;
  const useCustomApiKey = userApiKey.length > 0;

  // 管理员密码验证
  const adminPassword = data.adminPassword || "";
  const envAdminPassword = env.ADMIN_PASSWORD;
  const isDebugMode = adminPassword && envAdminPassword && adminPassword === envAdminPassword;
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  let remaining = null;
  if (!useCustomApiKey && !isDebugMode) {
    const result = checkAndIncrementUsage(clientIp);
    if (!result.allowed) {
      return makeResponse({
        success: false,
        error: `\u4ECA\u65E5\u6B21\u6570\u5DF2\u7528\u5B8C\uFF08${DAILY_LIMIT}\u6B21/\u5929\uFF09`,
        remaining: 0,
        limit: DAILY_LIMIT
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
    return makeResponse({ success: false, error: "\u672A\u914D\u7F6EAPI Key\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u586B\u5165" }, 400);
  }

  if (action === "check_usage") {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const userData = usageStorage.get(clientIp);
    const count = userData && userData.date === today ? userData.count : 0;
    return makeResponse({
      success: true,
      remaining: isDebugMode ? 9999 : Math.max(0, DAILY_LIMIT - count),
      limit: DAILY_LIMIT,
      debugMode: isDebugMode
    });
  }
  if (action === "process") {
    const imageBase64 = data.image || "";
    const pageNumber = data.pageNumber || 1;
    const theme = data.theme || "";
    if (!imageBase64) {
      return makeResponse({ success: false, error: "\u7F3A\u5C11\u56FE\u7247\u6570\u636E" }, 400);
    }
    const result = await processPptImage(imageBase64, pageNumber, apiKeyToUse, userBaseUrl, userModel);
    if (remaining !== null) {
      result.remaining = remaining;
      result.limit = DAILY_LIMIT;
    }
    return makeResponse(result);
  }
  if (action === "recognize_title") {
    const imageBase64 = data.image || "";
    const theme = data.theme || "";
    if (!imageBase64) {
      return makeResponse({ success: false, error: "\u7F3A\u5C11\u56FE\u7247\u6570\u636E" }, 400);
    }
    const result = await recognizeTitle(imageBase64, theme, apiKeyToUse, userBaseUrl, userModel);
    return makeResponse(result);
  }
  if (action === "summary") {
    const content = data.content || "";
    const result = await generateSummary(content, apiKeyToUse, userBaseUrl, userModel);
    if (remaining !== null) {
      result.remaining = remaining;
      result.limit = DAILY_LIMIT;
    }
    return makeResponse(result);
  }
  return makeResponse({ success: false, error: `\u672A\u77E5\u7684\u64CD\u4F5C: ${action}` }, 400);
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
