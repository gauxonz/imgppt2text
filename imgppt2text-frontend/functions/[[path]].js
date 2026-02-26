// Cloudflare Pages Function - 注入环境变量到前端
export async function onRequest(context) {
  const { request, env } = context;

  // 获取环境变量
  const config = {
    API_URL: env.API_URL || 'https://your-workers.workers.dev/',
    DEFAULT_BASE_URL: env.DEFAULT_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    DEFAULT_MODEL: env.DEFAULT_MODEL || 'qwen3.5-plus',
    DEFAULT_WEEKLY_LIMIT: env.DEFAULT_WEEKLY_LIMIT || '50'
  };

  // 发起原始请求
  const response = await context.next();

  // 如果是 HTML 响应，注入配置
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    let html = await response.text();

    // 替换占位符
    html = html.replace(/__API_URL__/g, config.API_URL);
    html = html.replace(/__DEFAULT_BASE_URL__/g, config.DEFAULT_BASE_URL);
    html = html.replace(/__DEFAULT_MODEL__/g, config.DEFAULT_MODEL);
    html = html.replace(/__DEFAULT_WEEKLY_LIMIT__/g, config.DEFAULT_WEEKLY_LIMIT);

    return new Response(html, {
      status: response.status,
      headers: {
        ...Object.fromEntries(response.headers),
        'content-type': 'text/html;charset=UTF-8'
      }
    });
  }

  return response;
}
