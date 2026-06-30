import type { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return async (req: Request): Promise<{ data?: T; error?: Response }> => {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return {
        error: new Response(JSON.stringify({ error: "Invalid JSON body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      };
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return {
        error: new Response(
          JSON.stringify({ error: "Validation failed", details: errors }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      };
    }

    return { data: parsed.data };
  };
}

export function validateSearchParams<T extends Record<string, unknown>>(
  schema: ZodSchema<T>,
) {
  return (req: Request): { data?: T; error?: Response } => {
    const { searchParams } = new URL(req.url);
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const parsed = schema.safeParse(params);
    if (!parsed.success) {
      const errors = formatZodError(parsed.error);
      return {
        error: new Response(
          JSON.stringify({ error: "Invalid parameters", details: errors }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        ),
      };
    }

    return { data: parsed.data };
  };
}

export function formatZodError(error: ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(issue.message);
  }
  return formatted;
}

export async function parseFormData<T>(
  req: Request,
  schema: ZodSchema<T>,
): Promise<{ data?: T; error?: Response }> {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return {
      error: new Response(JSON.stringify({ error: "Invalid form data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  const entries: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") {
      entries[key] = value;
    }
  });

  const parsed = schema.safeParse(entries);
  if (!parsed.success) {
    const errors = formatZodError(parsed.error);
    return {
      error: new Response(
        JSON.stringify({ error: "Validation failed", details: errors }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    };
  }

  return { data: parsed.data };
}
