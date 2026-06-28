// functions/_middleware.ts

export async function onRequest(context) {
  // 1. 获取用户请求的完整 URL
  const url = new URL(context.request.url);
  
  // 2. 从环境变量读取目标域名，如果未设置则使用请求中的域名（实现自我加速）
  //    你可以在 Pages 项目设置中为每个项目配置不同的 TARGET_HOSTNAME
  //    如果不配置，则默认代理到当前访问的域名本身
  const targetHostname = context.env.TARGET_HOSTNAME || url.hostname;

  // 3. 构造目标服务器的完整 URL（保留原路径和查询参数）
  const targetUrl = new URL(url.pathname + url.search, `https://${targetHostname}`);

  // 4. 创建新的代理请求，复制原请求的方法、头部和内容
  const proxyRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });

  // 5. 向目标服务器发出请求并返回响应
  try {
    const response = await fetch(proxyRequest);
    return response;
  } catch (error) {
    // 如果代理失败，返回一个友好的错误页面（可选）
    return new Response(`代理请求失败: ${error.message}`, { status: 502 });
  }
}