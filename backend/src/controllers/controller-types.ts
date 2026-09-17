export type ControllerRequest = {
  body: unknown;
  params: unknown;
  query: unknown;
  headers: Record<string, string | string[] | undefined>;
};

export type ControllerResponse<TBody = unknown> = {
  statusCode: number;
  body: TBody;
};

export type ControllerAdapter<TBody = unknown> = (
  request: ControllerRequest,
) => Promise<ControllerResponse<TBody>>;
