
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface ExportData {
  shift_date: string;
  shift_title: string;
  start_time: string;
  end_time: string;
  name: string;
  email: string;
  phone: string;
  registration_date: string;
}

export default function AdminExport() {
  const [exportData, setExportData] = useState<ExportData[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchExportData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .rpc("get_all_registrations_for_export");

      if (error) throw error;

      setExportData(data || []);
      toast({
        title: "Gegevens geladen",
        description: `${data?.length || 0} registraties gevonden.`,
      });
    } catch (error) {
      console.error("Error fetching export data:", error);
      toast({
        title: "Fout",
        description: "Kon exportgegevens niet laden.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (exportData.length === 0) {
      toast({
        title: "Geen gegevens",
        description: "Laad eerst de gegevens voordat je exporteert.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Datum", "Bardienst", "Tijd", "Naam", "Email", "Telefoon", "Inschrijfdatum"];
    
    const csvContent = [
      headers.join(","),
      ...exportData.map(row => [
        format(new Date(row.shift_date), "dd-MM-yyyy"),
        `"${row.shift_title}"`,
        `${row.start_time} - ${row.end_time}`,
        `"${row.name}"`,
        row.email,
        row.phone,
        format(new Date(row.registration_date), "dd-MM-yyyy HH:mm"),
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `bardienst-registraties-${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export succesvol",
      description: "CSV bestand is gedownload.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registraties Exporteren
          </CardTitle>
          <CardDescription>
            Genereer een overzicht van alle actieve registraties, gesorteerd op datum.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={fetchExportData} 
              disabled={loading}
              className="bg-[#0c6be0] hover:bg-[#0952b8]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Laden...
                </>
              ) : (
                "Gegevens Laden"
              )}
            </Button>
            
            {exportData.length > 0 && (
              <Button 
                onClick={exportToCSV}
                variant="outline"
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV Download ({exportData.length} registraties)
              </Button>
            )}
          </div>

          {exportData.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Bardienst</TableHead>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Naam</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefoon</TableHead>
                    <TableHead>Ingeschreven</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exportData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {format(new Date(row.shift_date), "dd MMM yyyy", { locale: nl })}
                      </TableCell>
                      <TableCell>{row.shift_title}</TableCell>
                      <TableCell>{row.start_time} - {row.end_time}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.phone}</TableCell>
                      <TableCell>
                        {format(new Date(row.registration_date), "dd MMM HH:mm", { locale: nl })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {exportData.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Klik op "Gegevens Laden" om registraties te bekijken.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
