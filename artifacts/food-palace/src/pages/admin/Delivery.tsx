import { useListDeliveryZones, useDeleteDeliveryZone, getListDeliveryZonesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminDelivery() {
  const { data: zones, isLoading } = useListDeliveryZones();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteDeliveryZone(0);

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListDeliveryZonesQueryKey() });
            toast({ title: "Delivery zone deleted" });
          }
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Delivery Zones</h1>
        <Button>
          <Plus className="w-4 h-4 mr-2" /> Add Zone
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Areas Covered</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : !zones || zones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No zones found</TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {zone.areas.map(area => (
                          <Badge key={area} variant="secondary" className="font-normal">{area}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(zone.fee)}</TableCell>
                    <TableCell>{zone.estimatedMinutes ? `${zone.estimatedMinutes} mins` : '-'}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-8 h-8 text-destructive"
                        onClick={() => handleDelete(zone.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
