use serde::{Deserialize, Serialize};
use serde_json::json;
use std::time::Duration;

#[derive(Debug, Deserialize)]
#[serde(default)]
pub struct PromptConnectionConfig {
    pub provider: String,
    #[serde(rename = "apiBase")]
    pub api_base: String,
    #[serde(rename = "apiKey")]
    pub api_key: String,
    pub model: String,
}

impl Default for PromptConnectionConfig {
    fn default() -> Self {
        Self {
            provider: "custom".to_string(),
            api_base: String::new(),
            api_key: String::new(),
            model: String::new(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct PromptConnectionResult {
    pub success: bool,
    pub message: String,
}

#[tauri::command]
pub async fn test_prompt_connection(
    config: PromptConnectionConfig,
) -> Result<PromptConnectionResult, String> {
    let api_base = config.api_base.trim().trim_end_matches('/').to_string();
    let api_key = config.api_key.trim().to_string();
    let model = config.model.trim().to_string();

    if api_base.is_empty() || api_key.is_empty() || model.is_empty() {
        return Ok(fail("请填写完整的 API 配置"));
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(20))
        .build()
        .map_err(|e| format!("创建 HTTP 客户端失败: {}", e))?;

    let is_anthropic =
        config.provider == "anthropic" || api_base.to_lowercase().contains("anthropic");
    let response = if is_anthropic {
        client
            .post(format!("{}/v1/messages", api_base))
            .header("content-type", "application/json")
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .json(&json!({
                "model": model,
                "max_tokens": 8,
                "messages": [{ "role": "user", "content": "Hi" }]
            }))
            .send()
            .await
    } else {
        client
            .post(format!("{}/chat/completions", api_base))
            .bearer_auth(api_key)
            .json(&json!({
                "model": model,
                "messages": [{ "role": "user", "content": "Hi" }],
                "max_tokens": 8
            }))
            .send()
            .await
    }
    .map_err(|e| format!("网络请求失败: {}", e))?;

    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    if status.is_success() {
        return Ok(PromptConnectionResult {
            success: true,
            message: "连接成功，API 配置可用".to_string(),
        });
    }

    Ok(fail(&format!(
        "连接失败: HTTP {} {}",
        status.as_u16(),
        extract_error_message(&body)
    )))
}

fn fail(message: &str) -> PromptConnectionResult {
    PromptConnectionResult {
        success: false,
        message: message.to_string(),
    }
}

fn extract_error_message(body: &str) -> String {
    if body.trim().is_empty() {
        return "无响应内容".to_string();
    }

    if let Ok(value) = serde_json::from_str::<serde_json::Value>(body) {
        if let Some(message) = value
            .get("error")
            .and_then(|error| error.get("message"))
            .and_then(|message| message.as_str())
        {
            return message.to_string();
        }
        if let Some(message) = value.get("message").and_then(|message| message.as_str()) {
            return message.to_string();
        }
    }

    body.chars().take(240).collect()
}
