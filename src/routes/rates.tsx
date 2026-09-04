import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/rates")({
  head: () => ({
    meta: [
      { title: "Payout rates by country — Rootx Shortner" },
      {
        name: "description",
        content:
          "See how much Rootx Shortner pays per 1000 visitors for every country. Transparent CPM rates, updated regularly.",
      },
      { property: "og:title", content: "Payout rates by country — Rootx Shortner" },
      {
        property: "og:description",
        content: "Transparent CPM payout rates per 1000 visits for every country.",
      },
    ],
  }),
  component: RatesPage,
});

function RatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["payout_rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payout_rates")
        .select("country_code,country_name,cpm")
        .order("cpm", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <SiteLayout>
      <section className="bg-soft-gradient py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold md:text-4xl">Payout rates</h1>
          <p className="mt-3 text-muted-foreground">
            Rates are shown per 1000 visitors (CPM). Earnings are credited to your balance the
            moment a visitor completes the page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12">
        <Card className="shadow-float">
          <CardHeader>
            <CardTitle>Current CPM rates</CardTitle>
            <CardDescription>Any country not listed earns the rest-of-world rate.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading rates…</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Country</TableHead>
                    <TableHead className="text-right">Per 1000 visits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.map((r) => (
                    <TableRow key={r.country_code}>
                      <TableCell className="font-medium">{r.country_name}</TableCell>
                      <TableCell className="text-right">${Number(r.cpm).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </SiteLayout>
  );
}
