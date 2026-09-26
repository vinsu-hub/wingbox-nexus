import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { createDirective, type ApiDirective } from "./directivesApi";

const directiveFormSchema = z.object({
  type: z.enum(["AD", "SB"]),
  referenceNo: z.string().min(1, "Reference number is required"),
  title: z.string().min(1, "Title is required"),
  applicability: z.string().optional(),
  issuingAuthority: z.string().optional(),
  effectiveDate: z.string().optional(),
  complianceDue: z.string().optional(),
  ataChapter: z.string().optional(),
  notes: z.string().optional(),
});

type DirectiveFormValues = z.infer<typeof directiveFormSchema>;

const DEFAULT_VALUES: DirectiveFormValues = {
  type: "AD",
  referenceNo: "",
  title: "",
  applicability: "",
  issuingAuthority: "",
  effectiveDate: "",
  complianceDue: "",
  ataChapter: "",
  notes: "",
};

/** First real react-hook-form + zod usage in this codebase — every other
 * "form" in the app is a plain uncontrolled <form onSubmit>. Kept
 * deliberately lean (create-only; editing is out of this pass's scope) to
 * satisfy "real, persisted directive records" without over-building. */
export function DirectiveForm({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (directive: ApiDirective) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DirectiveFormValues>({
    resolver: zodResolver(directiveFormSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const onSubmit = async (values: DirectiveFormValues) => {
    try {
      const created = await createDirective(values);
      toast.success(`${created.referenceNo} created.`, { description: created.title });
      reset(DEFAULT_VALUES);
      onCreated(created);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create directive.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next) {
          reset(DEFAULT_VALUES);
          onClose();
        }
      }}
    >
      <DialogContent className="directive-form-dialog">
        <DialogTitle>New directive</DialogTitle>
        <DialogDescription>Create a real, persisted AD/SB record. Compliance status per aircraft is tracked separately.</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="directive-form-row">
            <label>
              Type
              <select {...register("type")}>
                <option value="AD">Airworthiness Directive</option>
                <option value="SB">Service Bulletin</option>
              </select>
            </label>
            <label>
              Reference number
              <input {...register("referenceNo")} placeholder="AD 2026-05-01" />
              {errors.referenceNo && <small className="directive-form-error">{errors.referenceNo.message}</small>}
            </label>
          </div>
          <label>
            Title
            <input {...register("title")} placeholder="Engine fuel pump inspection" />
            {errors.title && <small className="directive-form-error">{errors.title.message}</small>}
          </label>
          <div className="directive-form-row">
            <label>
              Issuing authority
              <input {...register("issuingAuthority")} placeholder="FAA, EASA, manufacturer…" />
            </label>
            <label>
              AMM / ATA chapter
              <input {...register("ataChapter")} placeholder="73-21-00" />
            </label>
          </div>
          <div className="directive-form-row">
            <label>
              Effective date
              <input type="date" {...register("effectiveDate")} />
            </label>
            <label>
              Compliance due
              <input type="date" {...register("complianceDue")} />
            </label>
          </div>
          <label>
            Applicability
            <input {...register("applicability")} placeholder="Fleet-wide, or an aircraft type/family" />
          </label>
          <label>
            Notes
            <textarea rows={3} {...register("notes")} placeholder="Inspection scope, references, additional context…" />
          </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
            <button type="submit" className="primary-button" disabled={isSubmitting}>{isSubmitting ? "Creating…" : "Create directive"}</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
