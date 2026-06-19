const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { action, tid } = event.queryStringParameters || {};

  // 改成你的 safe_api.php 地址
  const DISCUZ_API = 'https://www.dadaozjzhitojian.cloud/sina/ff/safe_api.php';

  let targetUrl = `${DISCUZ_API}?action=${action}`;
  if (tid) {
    targetUrl += `&tid=${tid}`;
  }

  try {
    const response = await fetch(targetUrl);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '获取数据失败：' + error.message }),
    };
  }
};