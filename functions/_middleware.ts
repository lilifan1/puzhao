export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostname = url.hostname;

  // 从环境变量读取目标域名
  let targetHostname = context.env.TARGET_HOSTNAME || '';

  // 安全保护：如果未设置环境变量，或目标就是当前域名，则直接放行，不代理
  if (!targetHostname || targetHostname === hostname) {
    return; // 不处理，让请求正常通过
  }

  // 构造目标 URL 并转发请求
  const targetUrl = new URL(url.pathname + url.search, `https://${targetHostname}`);
  const proxyRequest = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
  });

  return await fetch(proxyRequest);
}