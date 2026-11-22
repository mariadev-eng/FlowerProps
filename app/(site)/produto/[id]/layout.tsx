import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const { data } = await supabase
    .from("products")
    .select("name, description, image")
    .eq("id", Number(id))
    .single();

  if (!data) {
    return { title: "Produto — FLOWER PROPS" };
  }

  const title = `${data.name} — FLOWER PROPS`;
  const description =
    data.description || "Buquês e acessórios feitos à mão pela FLOWER.";
  const image = data.image || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
      type: "website",
      siteName: "FLOWER PROPS",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default function ProdutoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}