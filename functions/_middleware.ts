# 创建 functions 文件夹
mkdir functions

# 创建 _middleware.ts 文件并写入内容
echo export async function onRequest(context) { > functions/_middleware.ts
echo   const url = new URL(context.request.url); >> functions/_middleware.ts
echo   const targetHostname = context.env.TARGET_HOSTNAME; >> functions/_middleware.ts
echo   if (!targetHostname) return; >> functions/_middleware.ts
echo   const targetUrl = new URL(url.pathname + url.search, https://${targetHostname}); >> functions/_middleware.ts
echo   const proxyRequest = new Request(targetUrl.toString(), { >> functions/_middleware.ts
echo     method: context.request.method, >> functions/_middleware.ts
echo     headers: context.request.headers, >> functions/_middleware.ts
echo     body: context.request.body, >> functions/_middleware.ts
echo   }); >> functions/_middleware.ts
echo   return await fetch(proxyRequest); >> functions/_middleware.ts
echo } >> functions/_middleware.ts