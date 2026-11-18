export type ItemCondition = "good" | "minor-damage" | "damaged" | "missing";

export type ReturnStatus = "ready" | "issued" | "returned";

export type EffectiveReturnStatus = ReturnStatus | "overdue";

export interface ReturnRecord {
  id: string;
  bookingId: string;
  issueDate: string | null;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  issuedQuantity: number;
  returnedQuantity: number;
  condition: ItemCondition | null;
  notes: string;
  issueNotes: string;
  status: ReturnStatus;
}

export interface IssueInput {
  issueDate: string;
  issuedQuantity: number;
  notes: string;
}

export interface ReturnInput {
  actualReturnDate: string;
  returnedQuantity: number;
  condition: ItemCondition;
  notes: string;
}
