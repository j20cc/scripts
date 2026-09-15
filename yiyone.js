// https://clashparty.org/docs/guide/override/javascript
function main(config) {
  const PROXY_NAME = "✈️墙外网站";
  const AI_PROXY_NAME = "R4-3|台湾-NF|家宽|原生";
  const JA_PROXY_NAME = "R5-1|日本-NF|GMO";
  const aiProxyList = [
    "openai.com",
    "chatgpt.com",
    "anthropic.com",
    "claude.com",
    "claude.ai",
    "clients6.google.com",
    "grok.com",
    "grokipedia.com",
    "ippure.com",
    "google",
    "antigravity",
    "github.com",
  ];
  const directList = [
    "shalltry",
    "tmctool",
    "tango",
    "trasre",
    "transsion",
    "aliyuncs",
    "mongodb",
    "hitranslate",
    "voxmate",
    "aliyuncs.com", "tencent", "feishu.cn",
    "amemv.com", "bytecdn.cn", "bytedance.com", "bytedancecdn.com",
    "bytednsdoc.com", "bytefcdnrd.com", "bytegecko.com",
    "bytegoofy.com", "byteimg.com", "bytetcc.com", "bytetos.com",
    "douyin.com", "douyincdn.com", "douyinpic.com", "douyinstatic.com",
    "douyinvod.com", "ibytedapm.com"
  ];
  const proxyList = [
    "docker.io",
    "twimg",
    "t.co",
    "x.com",
    "redditstatic",
    "flutter.dev",
  ];
  const jaProxyList = [
    "konami.net",
  ];

  const buildDomainRule = (value, policy) => {
    const type = value.includes(".") ? "DOMAIN-SUFFIX" : "DOMAIN-KEYWORD";
    return `${type},${value},${policy}`;
  };

  const rules = [
    "DST-PORT,22,DIRECT",
    "DST-PORT,27678," + PROXY_NAME,
    ...directList.map(value => buildDomainRule(value, "DIRECT")),
    ...proxyList.map(value => buildDomainRule(value, PROXY_NAME)),
    ...aiProxyList.map(value => buildDomainRule(value, AI_PROXY_NAME)),
    ...jaProxyList.map(value => buildDomainRule(value, JA_PROXY_NAME)),
  ];

  if (!Array.isArray(config.rules)) {
    config.rules = [];
  }

  config.rules.unshift(...rules);
  return config;
}
