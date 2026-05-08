import { createAzure } from "@ai-sdk/azure";

type AzureChatConfig = {
  deploymentName: string;
  apiKey: string;
  baseURL: string;
  apiVersion: string;
};

function compactString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseLegacyAzureEndpoint(endpoint: string): {
  baseURL: string;
  apiVersion: string | undefined;
  deploymentName: string | undefined;
} {
  const url = new URL(endpoint);

  // Accept either:
  // - https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=...
  // - https://{resource}.openai.azure.com/openai/... (any path)
  const baseURL = `${url.origin}/openai`;
  const apiVersion = url.searchParams.get("api-version") ?? undefined;

  const match = url.pathname.match(/\/openai\/deployments\/([^/]+)\//i);
  const deploymentName = match?.[1];

  return { baseURL, apiVersion, deploymentName };
}

function resolveAzureChatConfig(): { ok: true; config: AzureChatConfig } | { ok: false; error: string } {
  // Preferred (AI SDK defaults):
  // - AZURE_API_KEY
  // - AZURE_RESOURCE_NAME or AZURE_BASE_URL
  const apiKey =
    compactString(process.env.AZURE_API_KEY) ?? compactString(process.env.AZURE_OPENAI_API_KEY);

  if (!apiKey) {
    return {
      ok: false,
      error:
        "Missing Azure OpenAI key. Set AZURE_API_KEY (recommended) or AZURE_OPENAI_API_KEY in your environment.",
    };
  }

  const deploymentName =
    compactString(process.env.AZURE_OPENAI_DEPLOYMENT_NAME) ??
    compactString(process.env.AZURE_DEPLOYMENT_NAME);

  const apiVersionFromEnv = compactString(process.env.AZURE_OPENAI_API_VERSION) ?? compactString(process.env.AZURE_API_VERSION);

  const baseURLFromEnv = compactString(process.env.AZURE_BASE_URL);
  const resourceNameFromEnv = compactString(process.env.AZURE_RESOURCE_NAME);

  if (baseURLFromEnv) {
    const apiVersion = apiVersionFromEnv ?? "2025-01-01-preview";
    if (!deploymentName) {
      return {
        ok: false,
        error:
          "Missing Azure deployment name. Set AZURE_OPENAI_DEPLOYMENT_NAME (or AZURE_DEPLOYMENT_NAME).",
      };
    }
    return { ok: true, config: { apiKey, baseURL: baseURLFromEnv, apiVersion, deploymentName } };
  }

  if (resourceNameFromEnv) {
    const apiVersion = apiVersionFromEnv ?? "2025-01-01-preview";
    if (!deploymentName) {
      return {
        ok: false,
        error:
          "Missing Azure deployment name. Set AZURE_OPENAI_DEPLOYMENT_NAME (or AZURE_DEPLOYMENT_NAME).",
      };
    }
    return {
      ok: true,
      config: {
        apiKey,
        baseURL: `https://${resourceNameFromEnv}.openai.azure.com/openai`,
        apiVersion,
        deploymentName,
      },
    };
  }

  // Backward-compatible: AZURE_OPENAI_ENDPOINT contains a full legacy chat/completions URL.
  const legacyEndpoint = compactString(process.env.AZURE_OPENAI_ENDPOINT);
  if (legacyEndpoint) {
    const parsed = parseLegacyAzureEndpoint(legacyEndpoint);
    const apiVersion = apiVersionFromEnv ?? parsed.apiVersion ?? "2025-01-01-preview";
    const resolvedDeploymentName = deploymentName ?? parsed.deploymentName;
    if (!resolvedDeploymentName) {
      return {
        ok: false,
        error:
          "Missing Azure deployment name. Set AZURE_OPENAI_DEPLOYMENT_NAME, or include it in AZURE_OPENAI_ENDPOINT (/openai/deployments/<name>/...).",
      };
    }
    return {
      ok: true,
      config: {
        apiKey,
        baseURL: parsed.baseURL,
        apiVersion,
        deploymentName: resolvedDeploymentName,
      },
    };
  }

  return {
    ok: false,
    error:
      "Missing Azure endpoint configuration. Set AZURE_RESOURCE_NAME (recommended) or AZURE_BASE_URL, or provide AZURE_OPENAI_ENDPOINT (legacy).",
  };
}

export function getAzureChatModelOrNull(): { model: ReturnType<ReturnType<typeof createAzure>["chat"]>; deploymentName: string } | null {
  const resolved = resolveAzureChatConfig();
  if (!resolved.ok) return null;

  const azure = createAzure({
    apiKey: resolved.config.apiKey,
    baseURL: resolved.config.baseURL,
    apiVersion: resolved.config.apiVersion,
    useDeploymentBasedUrls: true,
  });

  return {
    model: azure.chat(resolved.config.deploymentName),
    deploymentName: resolved.config.deploymentName,
  };
}

export function getAzureChatConfigErrorOrNull(): string | null {
  const resolved = resolveAzureChatConfig();
  return resolved.ok ? null : resolved.error;
}

