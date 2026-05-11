import type { JsonLdNode } from "@/lib/seo";

type JsonLdProps = {
  data: JsonLdNode | JsonLdNode[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
