1. 创建目录 (CMD/PowerShell)：
```
cd %USERPROFILE%\.codex
```



2. 创建 config.toml (使用 UTF-8 编码)：
```
model_provider = "anyProvider"          
model = "gpt-5.2"                      
model_reasoning_effort = "high"      
network_access = "enabled"      

[model_providers.anyProvider]
name = "any Provider"              
base_url = "https://kfc-api.sxxe.net/v1"  # 代理基地址（OpenAI 兼容）
wire_api = "responses"                 # 使用 Responses API（推荐 GPT-5 系列，支持高级 reasoning）
requires_openai_auth = true            # 需要标准 OpenAI 风格的 API Key 认证     
```

3. 创建 auth.json：
```
{
  "OPENAI_API_KEY": "替换为 openai key"
}
```
