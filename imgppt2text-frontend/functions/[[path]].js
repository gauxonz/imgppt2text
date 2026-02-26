// Cloudflare Pages Function - 注入环境变量到前端
export async function onRequest(context) {
  const { request, env } = context;

  // 只注入 API_URL，其他配置从 Worker 获取
  const config = {
    API_URL: env.API_URL || 'https://your-workers.workers.dev/'
  };

  // 发起原始请求
  const response = await context.next();

  // 如果是 HTML 响应，注入配置
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    let html = await response.text();

    // 替换占位符
    html = html.replace(/__API_URL__/g, config.API_URL);

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
