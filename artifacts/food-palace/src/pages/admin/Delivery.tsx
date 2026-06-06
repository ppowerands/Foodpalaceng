import { FormEvent, useState } from "react";
import {
  DeliveryZone,
  getListDeliveryZonesQueryKey,
  useCreateDeliveryZone,
  useDeleteDeliveryZone,
  useListDeliveryZones,
  useUpdateDeliveryZone,
} from "@workspace/api-client-react";

import { useQueryClient } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { formatCurrency } from "@/lib/utils";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useToast } from "@/hooks/use-toast";

import { Plus, Edit2, Trash2 } from "lucide-react";

type DeliveryFormState = {
  name: string;
  fee: string;
  areas: string;
  estimatedMinutes: string;
};

const emptyForm: DeliveryFormState = {
  name: "",
  fee: "",
  areas: "",
  estimatedMinutes: "45",
};

export default function AdminDelivery() {
  const { data: zones, isLoading } = useListDeliveryZones();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<DeliveryFormState>(emptyForm);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useCreateDeliveryZone();
  const updateMutation = useUpdateDeliveryZone();
  const deleteMutation = useDeleteDeliveryZone();

  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: getListDeliveryZonesQueryKey(),
    });
  };

  const openCreate = () => {
    setEditingZone(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setForm({
      name: zone.name,
      fee: String(zone.fee),
      areas: zone.areas.join(", "),
      estimatedMinutes: String(zone.estimatedMinutes ?? 45),
    });
    setDialogOpen(true);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const data = {
      name: form.name.trim(),
      fee: Number(form.fee),
      areas: form.areas
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean),
      estimatedMinutes: Number(form.estimatedMinutes || 45),
    };

    if (editingZone) {
      updateMutation.mutate(
        { id: editingZone.id, data },
        {
          onSuccess: () => {
            setDialogOpen(false);
            refresh();
            toast({ title: "Delivery zone updated" });
          },
        }
      );
      return;
    }

    createMutation.mutate(
      { data },
      {
        onSuccess: () => {
          setDialogOpen(false);
          refresh();
          toast({ title: "Delivery zone created" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            refresh();
            toast({ title: "Delivery zone deleted" });
          },
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Delivery Zones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Edit customer delivery coverage, fees, and estimates.
          </p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Zone
        </Button>
      </div>

      <Card className="overflow-hidden">
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
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !zones || zones.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No zones found
                  </TableCell>
                </TableRow>
              ) : (
                zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell className="font-medium">{zone.name}</TableCell>

                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {zone.areas.map((area) => (
                          <Badge
                            key={area}
                            variant="secondary"
                            className="font-normal"
                          >
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>

                    <TableCell>{formatCurrency(zone.fee)}</TableCell>

                    <TableCell>
                      {zone.estimatedMinutes
                        ? `${zone.estimatedMinutes} mins`
                        : "-"}
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={() => openEdit(zone)}
                      >
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingZone ? "Edit Delivery Zone" : "Add Delivery Zone"}
            </DialogTitle>
          </DialogHeader>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Field label="Zone name">
              <Input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="Areas covered">
              <Textarea
                required
                value={form.areas}
                placeholder="Kaduna North, Barnawa, Ungwan Rimi"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    areas: event.target.value,
                  }))
                }
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Delivery fee">
                <Input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.fee}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fee: event.target.value,
                    }))
                  }
                />
              </Field>

              <Field label="Estimated minutes">
                <Input
                  required
                  min="1"
                  type="number"
                  value={form.estimatedMinutes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      estimatedMinutes: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingZone ? "Save Zone" : "Create Zone"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
