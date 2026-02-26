var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
// 默认值（env未设置时使用）
var DEFAULT_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
var DEFAULT_MODEL = "qwen3.5-plus";
// 每周免费限额，默认50次，可通过环境变量 WEEKLY_LIMIT 覆盖
var DEFAULT_WEEKLY_LIMIT = 50;

// 获取本周周一日期（使用本地时区）
function getWeekStartDate() {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

// 使用 KV 存储免费次数
async function checkAndIncrementUsage(env, deviceId, ip, weeklyLimit) {
  return await incrementUsage(env, deviceId, ip, weeklyLimit, 1);
}

// 批量增加使用次数
async function incrementUsage(env, deviceId, ip, weeklyLimit, increment) {
  const weekStart = getWeekStartDate();
  console.log("incrementUsage called, deviceId:", deviceId, "ip:", ip, "increment:", increment, "weekStart:", weekStart);

  // 分别获取 deviceId 和 IP 的使用次数
  let deviceCount = 0;
  let ipCount = 0;

  if (deviceId && deviceId !== 'unknown') {
    const deviceKey = `usage:${deviceId}:${weekStart}`;
    const deviceDataStr = await env.imgppt2txt_USAGE_KV.get(deviceKey);
    console.log("deviceKey:", deviceKey, "data:", deviceDataStr);
    if (deviceDataStr) {
      const deviceData = JSON.parse(deviceDataStr);
      if (deviceData.date === weekStart) {
        deviceCount = deviceData.count;
      }
    }
  }

  const ipKey = `usage:${ip}:${weekStart}`;
  const ipDataStr = await env.imgppt2txt_USAGE_KV.get(ipKey);
  console.log("ipKey:", ipKey, "data:", ipDataStr);
  if (ipDataStr) {
    const ipData = JSON.parse(ipDataStr);
    if (ipData.date === weekStart) {
      ipCount = ipData.count;
    }
  }

  console.log("deviceCount:", deviceCount, "ipCount:", ipCount);

  // 取次数较少的作为当前使用次数（更宽松）
  let totalCount = Math.min(deviceCount || Infinity, ipCount || Infinity);
  if (totalCount === Infinity) {
    totalCount = 0;
  }

  console.log("totalCount after min:", totalCount);

  // 检查是否超限
  if (totalCount + increment > weeklyLimit) {
    return { allowed: false, remaining: 0 };
  }

  // 计数+increment 并保存
  const newCount = totalCount + increment;
  console.log("newCount:", newCount);
  if (deviceId && deviceId !== 'unknown') {
    const deviceKey = `usage:${deviceId}:${weekStart}`;
    await env.imgppt2txt_USAGE_KV.put(deviceKey, JSON.stringify({ date: weekStart, count: newCount }), { expirationTtl: 86400 * 14 });
  }
  const ipKey2 = `usage:${ip}:${weekStart}`;
  await env.imgppt2txt_USAGE_KV.put(ipKey2, JSON.stringify({ date: weekStart, count: newCount }), { expirationTtl: 86400 * 14 });

  return { allowed: true, remaining: weeklyLimit - newCount };
}

// 获取当前使用次数（不增加）
async function getUsageCount(env, deviceId, ip) {
  const weekStart = getWeekStartDate();

  // 分别获取 deviceId 和 IP 的使用次数
  let deviceCount = 0;
  let ipCount = 0;

  if (deviceId && deviceId !== 'unknown') {
    const deviceKey = `usage:${deviceId}:${weekStart}`;
    const deviceDataStr = await env.imgppt2txt_USAGE_KV.get(deviceKey);
    if (deviceDataStr) {
      const deviceData = JSON.parse(deviceDataStr);
      if (deviceData.date === weekStart) {
        deviceCount = deviceData.count;
      }
    }
  }

  const ipKey = `usage:${ip}:${weekStart}`;
  const ipDataStr = await env.imgppt2txt_USAGE_KV.get(ipKey);
  if (ipDataStr) {
    const ipData = JSON.parse(ipDataStr);
    if (ipData.date === weekStart) {
      ipCount = ipData.count;
    }
  }

  // 取次数较少的作为当前使用次数
  let totalCount = Math.min(deviceCount || Infinity, ipCount || Infinity);
  if (totalCount === Infinity) return 0;
  return totalCount;
}
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

  // 每周限额从环境变量读取
  const weeklyLimit = parseInt(env.WEEKLY_LIMIT) || DEFAULT_WEEKLY_LIMIT;

  // 管理员密码验证
  const adminPassword = data.adminPassword || "";
  const envAdminPassword = env.ADMIN_PASSWORD;
  const isDebugMode = adminPassword && envAdminPassword && adminPassword === envAdminPassword;
  // 获取 IP
  const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
  // 优先使用前端传入的 deviceId
  const deviceId = data.deviceId || "";
  // 是否跳过使用次数检查（如已预扣或使用自定义API）
  const skipUsageCheck = data.skipUsageCheck || false;
  console.log("Request:", action, "useCustomApiKey:", useCustomApiKey, "isDebugMode:", isDebugMode, "skipUsageCheck:", skipUsageCheck);

  // 预扣使用次数 - 需要在 API Key 检查之前处理
  if (action === "reserve_usage") {
    if (useCustomApiKey || isDebugMode) {
      return makeResponse({ success: true, allowed: true, remaining: 9999 });
    }
    const reserveCount = parseInt(data.count) || 1;
    const currentCount = await getUsageCount(env, deviceId, clientIp);
    if (currentCount + reserveCount > weeklyLimit) {
      return makeResponse({
        success: true,
        allowed: false,
        remaining: weeklyLimit - currentCount,
        limit: weeklyLimit
      });
    }
    const result = await incrementUsage(env, deviceId, clientIp, weeklyLimit, reserveCount);
    return makeResponse({
      success: true,
      allowed: result.allowed,
      remaining: result.remaining,
      limit: weeklyLimit
    });
  }

  let remaining = null;
  // process 操作需要增加计数
  console.log("Checking process condition:", {useCustomApiKey, isDebugMode, skipUsageCheck, action});
  if (!useCustomApiKey && !isDebugMode && !skipUsageCheck && action === "process") {
    console.log("Incrementing usage for process");
    const result = await checkAndIncrementUsage(env, deviceId, clientIp, weeklyLimit);
    if (!result.allowed) {
      return makeResponse({
        success: false,
        error: `本周免费次数已用完（${weeklyLimit}次/周）`,
        remaining: 0,
        limit: weeklyLimit
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
    console.log("check_usage called, deviceId:", deviceId, "clientIp:", clientIp);
    const count = await getUsageCount(env, deviceId, clientIp);
    console.log("check_usage count:", count, "remaining:", weeklyLimit - count);
    const responseData = {
      success: true,
      remaining: isDebugMode ? 9999 : Math.max(0, weeklyLimit - count),
      limit: weeklyLimit,
      debugMode: isDebugMode,
      _debug: { count, deviceId, clientIp }
    };
    return makeResponse(responseData);
  }

  // 获取服务器配置
  if (action === "get_config") {
    return makeResponse({
      success: true,
      baseUrl: env.DEFAULT_BASE_URL || DEFAULT_BASE_URL,
      model: env.DEFAULT_MODEL || DEFAULT_MODEL,
      weeklyLimit: weeklyLimit
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
      result.limit = weeklyLimit;
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
      result.limit = weeklyLimit;
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
