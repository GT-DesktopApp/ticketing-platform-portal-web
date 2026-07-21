"use client";

import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Phone,
  Plus,
  Search,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Switch } from "@/components/ui/switch";
import { useDebounce } from "@/hooks/use-debounce";
import { ROUTES } from "@/lib/constants/routes";
import { BookingSummary } from "@/modules/pos/components/booking/booking-summary";
import { SeatAllocation } from "@/modules/pos/components/booking/seat-allocation";
import {
  useCreateCustomer,
  useCustomerSearch,
} from "@/modules/pos/hooks/use-pos";
import {
  type ComplimentaryDetails,
  useCartStore,
} from "@/modules/pos/store/cart-store";
import type { Customer } from "@/modules/pos/types";
import { passengerLabels } from "@/modules/pos/utils/passengers";
import {
  isValidGstin,
  isValidPhone,
  normalizeName,
} from "@/modules/pos/utils/validation";

/**
 * Customer Information step (newdesignCustomerinfo.png):
 *   • Select Existing Customer — debounced lookup + inline Add New Customer,
 *     with a "Selected Customer Details" block (Name, Mobile, GSTN).
 *   • Issue Complimentary Ticket? — a toggle that reveals the full form
 *     (Pass Details, Guest Details, Visitor Count, Reference By) or an
 *     informative notice when off.
 *   • Seat Allocation — a collapsible summary that leads into the seat step.
 */
export function CustomerStep() {
  const router = useRouter();
  const attraction = useCartStore((s) => s.selectedAttraction);
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const isComplimentary = useCartStore((s) => s.isComplimentary);
  const setComplimentary = useCartStore((s) => s.setComplimentary);
  const comp = useCartStore((s) => s.complimentary);
  const setComp = useCartStore((s) => s.setComplimentaryDetails);
  const tickets = useCartStore((s) => s.tickets);
  const seats = useCartStore((s) => s.seats);

  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 350);
  const { data: results = [], isFetching } = useCustomerSearch(debounced);
  const [showAdd, setShowAdd] = useState(false);

  // Guard: no cart → back to booking.
  useEffect(() => {
    if (!attraction) router.replace(ROUTES.POS);
  }, [attraction, router]);

  function handleContinue() {
    if (!canContinue) return;
    // Seats are allocated inline here (not a separate step), so Continue always
    // proceeds to Payment.
    router.push(`${ROUTES.POS}/payment`);
  }

  // Customer gate: a selected customer, OR complimentary with a valid guest.
  const guestMobileOk = !comp.guestMobile || isValidPhone(comp.guestMobile);
  const customerOk = isComplimentary
    ? normalizeName(comp.guestName).length > 0 && guestMobileOk
    : customer !== null;

  // Seat gate: for seated attractions, every passenger must have a seat.
  const passengers = useMemo(
    () => passengerLabels(attraction, tickets),
    [attraction, tickets],
  );
  const seatsAssigned = passengers.filter((p) => seats[p]).length;
  const seatsOk =
    !attraction?.requiresSeats ||
    (passengers.length > 0 && seatsAssigned === passengers.length);

  const canContinue = customerOk && seatsOk;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="text-2xl font-bold" style={{ color: "var(--pos-navy)" }}>
        Customer Information
      </h1>

      <BookingSummary />

      {/* --- Select Existing Customer --- */}
      <section className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserRound className="size-5" style={{ color: "var(--pos-navy)" }} />
          <h2 className="text-lg font-semibold">Select Existing Customer</h2>
        </div>

        <Label className="mb-1.5 block">
          Customer<span className="text-destructive">*</span>
        </Label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or mobile number"
              className="pl-8"
            />
            {debounced && (results.length > 0 || isFetching) && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
                {isFetching && (
                  <p className="px-3 py-2 text-sm text-muted-foreground">
                    Searching…
                  </p>
                )}
                {results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setCustomer(c);
                      setSearch(c.name);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                  >
                    <span>{c.name}</span>
                    <span className="text-muted-foreground">{c.mobile}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Button
            variant="outline"
            className="border-[var(--pos-navy)] text-[var(--pos-navy)]"
            onClick={() => setShowAdd((v) => !v)}
          >
            <Plus className="size-4" /> Add New Customer
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Select a registered customer from the list.
        </p>

        {showAdd && (
          <AddCustomerInline
            onCreated={(c) => {
              setCustomer(c);
              setSearch(c.name);
              setShowAdd(false);
            }}
          />
        )}

        {/* Selected Customer Details block */}
        <div className="mt-4 rounded-lg bg-muted/40 p-4">
          <p
            className="mb-3 font-semibold"
            style={{ color: "var(--pos-navy)" }}
          >
            Selected Customer Details
          </p>
          {customer ? (
            <dl className="space-y-2 text-sm">
              <DetailRow
                icon={<UserRound className="size-4" />}
                label="Customer Name:"
                value={customer.name}
              />
              <DetailRow
                icon={<Phone className="size-4" />}
                label="Mobile Number:"
                value={customer.mobile}
              />
              <DetailRow
                icon={<FileText className="size-4" />}
                label="GSTN:"
                value={customer.gstn || "—"}
              />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              No customer selected. Please select a customer from the list or
              add a new one.
            </p>
          )}
        </div>
      </section>

      {/* --- Issue Complimentary Ticket? --- */}
      <section className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              className="text-lg font-semibold"
              style={{ color: "var(--pos-navy)" }}
            >
              Issue Complimentary Ticket?
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Enable this only if the booking is being issued under a
              complimentary pass/reference.
            </p>
          </div>
          <Switch
            checked={isComplimentary}
            onCheckedChange={setComplimentary}
          />
        </div>

        {isComplimentary ? (
          <ComplimentaryForm value={comp} onChange={setComp} />
        ) : (
          <div className="mt-4 rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
            Complimentary pass details are hidden. Toggle the switch above to
            issue this booking against a complimentary pass.
          </div>
        )}
      </section>

      {/* --- Seat Allocation (inline, seated attractions only) --- */}
      {attraction?.requiresSeats && <SeatAllocation attraction={attraction} />}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(ROUTES.POS)}>
          <ArrowLeft className="size-4" /> Back
        </Button>
        <Button
          className="pos-btn-amber font-semibold"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Continue <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <dt className="w-36 shrink-0 text-muted-foreground">{label}</dt>
      <dd className="font-medium" style={{ color: "var(--pos-navy)" }}>
        {value}
      </dd>
    </div>
  );
}

/** The full complimentary form: Pass / Guest / Visitor count / Reference. */
function ComplimentaryForm({
  value,
  onChange,
}: {
  value: ComplimentaryDetails;
  onChange: (patch: Partial<ComplimentaryDetails>) => void;
}) {
  const total =
    (parseInt(value.adultCount) || 0) + (parseInt(value.childCount) || 0);

  return (
    <div className="mt-5 space-y-6">
      {/* Pass Details */}
      <FormGroup title="Pass Details">
        <Field label="Pass No.">
          <Input
            value={value.passNo}
            onChange={(e) => onChange({ passNo: e.target.value })}
            placeholder="Enter Pass no."
          />
        </Field>
        <Field label="Date">
          <Input
            type="date"
            value={value.passDate}
            onChange={(e) => onChange({ passDate: e.target.value })}
          />
        </Field>
        <Field label="Discount %">
          <Input
            type="number"
            min="0"
            max="100"
            value={value.discountPercent}
            onChange={(e) => onChange({ discountPercent: e.target.value })}
            placeholder="Select Discount %"
          />
        </Field>
      </FormGroup>

      {/* Guest Details */}
      <FormGroup title="Guest Details">
        <Field label="Guest Name">
          <Input
            value={value.guestName}
            onChange={(e) => onChange({ guestName: e.target.value })}
            placeholder="Enter Guest Name"
          />
        </Field>
        <Field label="Mobile Number">
          <PhoneInput
            value={value.guestMobile || undefined}
            onChange={(v) => onChange({ guestMobile: v ?? "" })}
            invalid={
              value.guestMobile.length > 0 && !isValidPhone(value.guestMobile)
            }
            placeholder="Enter Mobile Number"
          />
        </Field>
        <Field label="Department (optional)">
          <Input
            value={value.guestDepartment}
            onChange={(e) => onChange({ guestDepartment: e.target.value })}
            placeholder="Enter Department"
          />
        </Field>
        <Field label="Post/Designation (optional)">
          <Input
            value={value.guestDesignation}
            onChange={(e) => onChange({ guestDesignation: e.target.value })}
            placeholder="Enter Post/Designation"
          />
        </Field>
      </FormGroup>

      {/* Visitor Count */}
      <FormGroup title="Visitor Count">
        <Field label="Adults/Senior Citizen">
          <Input
            type="number"
            min="0"
            value={value.adultCount}
            onChange={(e) => onChange({ adultCount: e.target.value })}
            placeholder="Enter Adults"
          />
        </Field>
        <Field label="Children">
          <Input
            type="number"
            min="0"
            value={value.childCount}
            onChange={(e) => onChange({ childCount: e.target.value })}
            placeholder="Enter Children"
          />
        </Field>
        <Field label="Total">
          <Input value={String(total)} readOnly className="bg-muted/40" />
        </Field>
      </FormGroup>

      {/* Reference By */}
      <FormGroup title="Reference By">
        <Field label="Reference Person Name">
          <Input
            value={value.referenceName}
            onChange={(e) => onChange({ referenceName: e.target.value })}
            placeholder="Enter Name"
          />
        </Field>
        <Field label="Mobile Number">
          <PhoneInput
            value={value.referenceMobile || undefined}
            onChange={(v) => onChange({ referenceMobile: v ?? "" })}
            invalid={
              value.referenceMobile.length > 0 &&
              !isValidPhone(value.referenceMobile)
            }
            placeholder="Enter Mobile Number"
          />
        </Field>
        <Field label="Department">
          <Input
            value={value.referenceDepartment}
            onChange={(e) => onChange({ referenceDepartment: e.target.value })}
            placeholder="Enter Department"
          />
        </Field>
        <Field label="Post/Designation">
          <Input
            value={value.referenceDesignation}
            onChange={(e) => onChange({ referenceDesignation: e.target.value })}
            placeholder="Enter Post/Designation"
          />
        </Field>
      </FormGroup>
    </div>
  );
}

/** A titled group of fields laid out in a responsive 2/3-col grid. */
function FormGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-[13px] font-bold tracking-wide text-[var(--pos-navy)] uppercase">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </div>
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
    <label className="block space-y-1.5">
      <span className="text-[13px] font-medium text-[var(--pos-navy)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function AddCustomerInline({
  onCreated,
}: {
  onCreated: (c: Customer) => void;
}) {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState<string | undefined>(undefined);
  const [gstn, setGstn] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    mobile?: string;
    gstn?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const createCustomer = useCreateCustomer();

  /** Validate every field; returns true when the form is submittable. */
  function validate(): boolean {
    const next: { name?: string; mobile?: string; gstn?: string } = {};
    if (!normalizeName(name)) next.name = "Name is required";
    if (!isValidPhone(mobile)) next.mobile = "Enter a valid mobile number";
    const g = gstn.trim().toUpperCase();
    if (g && !isValidGstin(g)) next.gstn = "Enter a valid GST number";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    setError(null);
    if (!validate()) return;
    try {
      const c = await createCustomer.mutateAsync({
        name: normalizeName(name),
        mobile: mobile as string,
        email: "",
        gstn: gstn.trim().toUpperCase(),
        notes: "",
      });
      onCreated(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create customer.");
    }
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2">
      <div className="space-y-1.5">
        <Label>Name *</Label>
        <Input
          value={name}
          // Block a leading space so the name can't start with whitespace;
          // internal spaces are allowed and collapsed on save.
          onChange={(e) => setName(e.target.value.replace(/^\s+/, ""))}
          onBlur={() => setName((n) => normalizeName(n))}
          aria-invalid={!!errors.name}
          placeholder="Customer name"
        />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>Mobile *</Label>
        <PhoneInput
          value={mobile}
          onChange={setMobile}
          invalid={!!errors.mobile}
          placeholder="Enter mobile number"
        />
        {errors.mobile && (
          <p className="text-xs text-destructive">{errors.mobile}</p>
        )}
      </div>
      <div className="space-y-1.5 sm:col-span-2">
        <Label>GSTN</Label>
        <Input
          value={gstn}
          // GSTINs are upper-case; no spaces allowed inside.
          onChange={(e) =>
            setGstn(e.target.value.toUpperCase().replace(/\s+/g, ""))
          }
          maxLength={15}
          aria-invalid={!!errors.gstn}
          placeholder="15-digit GST number (optional)"
        />
        {errors.gstn && (
          <p className="text-xs text-destructive">{errors.gstn}</p>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive sm:col-span-2">{error}</p>
      )}
      <div className="sm:col-span-2">
        <Button
          className="pos-btn-navy"
          onClick={submit}
          disabled={createCustomer.isPending}
        >
          {createCustomer.isPending ? "Saving…" : "Save Customer"}
        </Button>
      </div>
    </div>
  );
}
