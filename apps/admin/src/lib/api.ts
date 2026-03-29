import { headers } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const reqHeaders = await headers();
  const cookie = reqHeaders.get("cookie") ?? "";
  return fetch(`${API_URL}${path}`, {
    ...init,
    headers: { cookie, ...init?.headers },
    cache: "no-store",
  });
}
