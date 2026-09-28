export function configuredModels(primaryModel?: string, modelList?: string) {
  const models = [primaryModel, ...(modelList?.split(",") ?? [])]
    .map((model) => model?.trim())
    .filter((model): model is string => Boolean(model));
  return [...new Set(models)];
}

export function selectConfiguredModel(models: string[], requestedModel?: string) {
  if (models.length === 0) throw new Error("No connected-agent model is configured.");
  if (!requestedModel) return models[0];
  if (!models.includes(requestedModel)) throw new Error("The selected model is not enabled for this playground.");
  return requestedModel;
}
