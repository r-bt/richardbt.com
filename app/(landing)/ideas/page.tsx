import IdeasList from "@/components/IdeasList.mdx";

export default function Ideas() {
  return (
    <div className="py-4">
      <h2 className="text-lg pb-4">Ideas</h2>
      <p className="text-md pb-4">
        These are things I will potential come back to build / explore
      </p>
      <IdeasList />
    </div>
  );
}
