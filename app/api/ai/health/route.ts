import { getAzureChatConfigErrorOrNull, getAzureChatModelOrNull } from "@/lib/ai/azure";

export const dynamic = "force-dynamic";

export async function GET() {
  const model = getAzureChatModelOrNull();
  const error = getAzureChatConfigErrorOrNull();

  return Response.json({
    ok: Boolean(model) && !error,
    azure: {
      configured: Boolean(model),
      deploymentName: model?.deploymentName ?? null,
      error,
    },
  });
}

