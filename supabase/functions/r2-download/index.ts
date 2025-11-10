const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AWS Signature V4 signing
async function createAwsSignature(
  secretKey: string,
  dateStamp: string,
  region: string,
  service: string,
  stringToSign: string
): Promise<string> {
  const encoder = new TextEncoder();

  async function hmac(key: ArrayBuffer | Uint8Array, data: string | Uint8Array) {
    const keyData = key instanceof Uint8Array ? key : new Uint8Array(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const msg = typeof data === 'string' ? encoder.encode(data) : data;
    return crypto.subtle.sign('HMAC', cryptoKey, msg as BufferSource);
  }

  const kSecret = encoder.encode('AWS4' + secretKey);
  const kDate = await hmac(kSecret, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmac(kSigning, stringToSign);

  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256Hash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath, expiresIn = 3600 } = await req.json();

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: filePath' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Always use bucket "babuadvocate"
    const bucket = 'babuadvocate';

    const accountId = Deno.env.get('CLOUDFLARE_R2_ACCOUNT_ID');
    const accessKeyId = Deno.env.get('CLOUDFLARE_R2_ACCESS_KEY_ID');
    const secretAccessKey = Deno.env.get('CLOUDFLARE_R2_SECRET_ACCESS_KEY');

    if (!accountId || !accessKeyId || !secretAccessKey) {
      const missing = [
        !accountId ? 'CLOUDFLARE_R2_ACCOUNT_ID' : null,
        !accessKeyId ? 'CLOUDFLARE_R2_ACCESS_KEY_ID' : null,
        !secretAccessKey ? 'CLOUDFLARE_R2_SECRET_ACCESS_KEY' : null,
      ].filter(Boolean);
      console.error('Missing R2 credentials:', missing.join(', '));
      return new Response(
        JSON.stringify({ error: 'Server configuration error', missing }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const now = new Date();
    const expiryDate = new Date(now.getTime() + expiresIn * 1000);
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    
    const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
    const credential = `${accessKeyId}/${credentialScope}`;
    
    const canonicalRequest = [
      'GET',
      `/${bucket}/${filePath}`,
      `X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host`,
      `host:${accountId}.r2.cloudflarestorage.com`,
      '',
      'host',
      'UNSIGNED-PAYLOAD'
    ].join('\n');
    
    const canonicalRequestHash = await sha256Hash(canonicalRequest);
    
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      credentialScope,
      canonicalRequestHash
    ].join('\n');
    
    const signature = await createAwsSignature(
      secretAccessKey,
      dateStamp,
      'auto',
      's3',
      stringToSign
    );
    
    const signedUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}/${filePath}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=${encodeURIComponent(credential)}&X-Amz-Date=${amzDate}&X-Amz-Expires=${expiresIn}&X-Amz-SignedHeaders=host&X-Amz-Signature=${signature}`;

    console.log(`Generated signed URL for: ${filePath} in bucket: ${bucket}`);

    return new Response(
      JSON.stringify({
        success: true,
        signedUrl,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating signed URL from R2:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
