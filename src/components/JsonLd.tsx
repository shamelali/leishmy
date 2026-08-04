type JsonLdProps = {
  data: Record<string, unknown>;
  nonce?: string;
};

/** Emits structured data safely without allowing provider content to close the script tag. */
export function JsonLd({ data, nonce }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
