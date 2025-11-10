// supabase/functions/proxy-download/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Expose-Headers": "Content-Length, Content-Disposition, Content-Type",
};

function getFilenameFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    return parts.pop() || "download";
  } catch {
    return "download";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse input
    let url: string | null = null;
    let filename: string | null = null;

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      url = searchParams.get("url");
      filename = searchParams.get("filename");
    } else if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      url = body.url;
      filename = body.filename;
    } else {
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    // Validate
    if (!url) {
      return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure it's an R2 URL
    if (!url.includes("r2.cloudflarestorage.com")) {
      return new Response(JSON.stringify({ error: "Invalid URL — must be a Cloudflare R2 file URL" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Downloading Cloudflare R2 file: ${url}`);

    // Fetch the file
    const response = await fetch(url);
    if (!response.ok || !response.body) {
      const errorText = await response.text().catch(() => "");
      console.error("R2 download failed:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch R2 file" }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prepare response headers
    const headers = new Headers(corsHeaders);
    headers.set("Content-Type", response.headers.get("content-type") ?? "application/octet-stream");
    const downloadName = filename || getFilenameFromUrl(url);
    headers.set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);

    const contentLength = response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    console.log("✅ R2 file download successful");

    // Stream back the file
    return new Response(response.body, { status: 200, headers });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
