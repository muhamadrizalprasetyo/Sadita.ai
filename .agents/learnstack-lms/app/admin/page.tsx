import { DataTable } from "./_components/sidebar/data-table";
import { SectionCards } from "./_components/sidebar/section-cards";
import { ChartAreaInteractive } from "./_components/sidebar/chart-area-interactive";
import data from "./data.json";

export default function AdminPage() {
  return (
    <>
      <SectionCards />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </>
  );
}
