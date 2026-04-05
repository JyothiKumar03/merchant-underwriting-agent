import { MerchantDetailView } from "@/components/merchant-detail-view";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MerchantPage({ params }: PageProps) {
  const { id } = await params;
  return <MerchantDetailView merchant_id={id} />;
}
