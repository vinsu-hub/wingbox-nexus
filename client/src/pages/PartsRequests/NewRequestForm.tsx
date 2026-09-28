import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { partRequests, type PartRequest } from "@/data/mock/parts-requests";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

const required = z
  .string()
  .trim()
  .min(1, "This field is required.")
  .max(120, "Use 120 characters or fewer.");
const schema = z.object({
  partName: required,
  partNumber: required,
  serial: z.string().trim().max(120),
  aircraftType: required,
  qty: z
    .number()
    .int("Enter a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(9999),
  client: required,
  requestedBy: required,
  priority: z.enum(["High", "Medium", "Low"]),
  notes: z.string().trim().max(2000),
});
type Values = z.infer<typeof schema>;
const names = Array.from(new Set(partRequests.map(row => row.partName)));
const defaults: Values = {
  partName: names[0],
  partNumber: "",
  serial: "",
  aircraftType: "",
  qty: 1,
  client: "",
  requestedBy: "",
  priority: "Medium",
  notes: "",
};
export function NewRequestForm({
  open,
  onClose,
  onCreated,
  nextId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (row: PartRequest) => void;
  nextId: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });
  const close = () => {
    reset(defaults);
    onClose();
  };
  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) close();
      }}
    >
      <DialogContent className="parts-form">
        <DialogTitle>New Part Request</DialogTitle>
        <DialogDescription>
          This creates a mock request in this browser session. Nothing is saved
          past a refresh.
        </DialogDescription>
        <form
          noValidate
          onSubmit={handleSubmit(values => {
            const representative = partRequests.find(
              row => row.partName === values.partName
            )!;
            onCreated({
              ...values,
              id: nextId,
              stage: "Requested",
              requestDate: new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "2-digit",
                year: "numeric",
              }),
              photo: representative.photo,
              category: representative.category,
              qaqc: partRequests[0].qaqc.map(check => ({
                ...check,
                status: "Pending",
                date: undefined,
              })),
              documents: [],
            });
            reset(defaults);
          })}
        >
          <label>
            Part name
            <select {...register("partName")}>
              {names.map(name => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <div className="parts-form-grid">
            {(
              [
                ["partNumber", "Part number"],
                ["serial", "Serial (optional)"],
                ["aircraftType", "Aircraft type"],
                ["client", "Client"],
                ["requestedBy", "Requested by"],
              ] as const
            ).map(([field, label]) => (
              <label key={field}>
                {label}
                <input
                  {...register(field)}
                  aria-label={label}
                  aria-invalid={!!errors[field]}
                  aria-describedby={
                    errors[field] ? `parts-error-${field}` : undefined
                  }
                />
                {errors[field] && (
                  <small id={`parts-error-${field}`} role="alert">
                    {errors[field]?.message}
                  </small>
                )}
              </label>
            ))}
            <label>
              Quantity
              <input
                type="number"
                min={1}
                max={9999}
                {...register("qty", { valueAsNumber: true })}
                aria-label="Quantity"
                aria-invalid={!!errors.qty}
                aria-describedby={errors.qty ? "parts-error-qty" : undefined}
              />
              {errors.qty && (
                <small id="parts-error-qty" role="alert">
                  {errors.qty.message}
                </small>
              )}
            </label>
          </div>
          <label>
            Priority
            <select {...register("priority")}>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </label>
          <label>
            Notes
            <textarea rows={3} {...register("notes")} />
            {errors.notes && <small role="alert">{errors.notes.message}</small>}
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Add request
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
