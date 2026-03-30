import { notFound } from "next/navigation";
import prisma from "@/lib/db";
import LandingPageRenderer from "@/components/landing-page/LandingPageRenderer";
import type { LandingPageData } from "@/lib/landing-page/types";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const page = await prisma.landingPage.findUnique({ where: { slug: params.slug } });
  if (!page) return { title: "Page not found" };
  const data = page.data as unknown as LandingPageData;
  return { title: data.productName };
}

export default async function ShopPage({ params }: Props) {
  const page = await prisma.landingPage.findUnique({ where: { slug: params.slug } });

  if (!page || !page.published) {
    notFound();
  }

  const data = page.data as unknown as LandingPageData;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;600;700;800;900&family=Quicksand:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <LandingPageRenderer data={data} editable={false} />
    </>
  );
}
