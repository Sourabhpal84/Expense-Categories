export type ExpenseCategory =
  | "Ingredients"
  | "Cheese & Dairy"
  | "Vegetables"
  | "Meat & Seafood"
  | "Sauces & Spices"
  | "Dough & Bakery"
  | "Beverages"
  | "Packaging"
  | "Pizza Boxes"
  | "Disposable Cutlery"
  | "Delivery"
  | "Fuel"
  | "Kitchen Equipment"
  | "Repairs & Maintenance"
  | "Cleaning & Hygiene"
  | "Licenses & Permits"
  | "Marketing"
  | "Discounts & Promotions"
  | "Salary"
  | "Staff Meals"
  | "Training"
  | "Rent"
  | "Utilities"
  | "Electricity"
  | "Water"
  | "Internet & Phone"
  | "Software"
  | "Accounting & Legal"
  | "Bank Charges"
  | "Vehicle Maintenance"
  | "Payment Gateway"
  | "Payment Gateway Charges"
  | "Marketplace Commission"
  | "Taxes & GST"
  | "Insurance"
  | "Furniture & Fixtures"
  | "Uniforms"
  | "Wastage & Spoilage"
  | "Refunds"
  | "Office Supplies"
  | "Misc";

export const expenseCategories: ExpenseCategory[] = [
  "Ingredients",
  "Cheese & Dairy",
  "Vegetables",
  "Meat & Seafood",
  "Sauces & Spices",
  "Dough & Bakery",
  "Beverages",
  "Packaging",
  "Pizza Boxes",
  "Disposable Cutlery",
  "Delivery",
  "Fuel",
  "Kitchen Equipment",
  "Repairs & Maintenance",
  "Cleaning & Hygiene",
  "Licenses & Permits",
  "Marketing",
  "Discounts & Promotions",
  "Salary",
  "Staff Meals",
  "Training",
  "Rent",
  "Utilities",
  "Electricity",
  "Water",
  "Internet & Phone",
  "Software",
  "Accounting & Legal",
  "Bank Charges",
  "Vehicle Maintenance",
  "Payment Gateway",
  "Payment Gateway Charges",
  "Marketplace Commission",
  "Taxes & GST",
  "Insurance",
  "Furniture & Fixtures",
  "Uniforms",
  "Wastage & Spoilage",
  "Refunds",
  "Office Supplies",
  "Misc"
];

export type Expense = {
  id: string;
  userId: string;
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  paidFrom?: FinanceAccount;
  supplier?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type FinanceAccount = "shop_cash" | "business_bank_upi" | "owner_personal_upi" | "unknown";

export type LedgerTransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "owner_contribution"
  | "owner_withdrawal"
  | "adjustment";

export type DailySessionStatus = "open" | "closed" | "reopened";

export type LedgerTransaction = {
  id: string;
  userId: string;
  date: string;
  sessionId?: string;
  type: LedgerTransactionType;
  amount: number;
  sourceAccount?: FinanceAccount;
  destinationAccount?: FinanceAccount;
  category?: string;
  note?: string;
  relatedOrderId?: string;
  relatedExpenseId?: string;
  voided?: boolean;
  voidReason?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt?: string;
};

export type ClosingAdjustment = {
  id: string;
  userId: string;
  date: string;
  sessionId: string;
  reason:
    | "missing_expense"
    | "owner_withdrawal"
    | "owner_contribution"
    | "cash_to_bank"
    | "bank_to_cash"
    | "supplier_payment"
    | "personal_expense_from_shop"
    | "cash_shortage"
    | "extra_cash"
    | "other_adjustment";
  amount: number;
  account: "cash" | "bank" | "both";
  note?: string;
  createdAt: string;
};

export type DailySession = {
  id: string;
  userId: string;
  date: string;
  openingCash: number;
  openingBank: number;
  openingOwnerBalance: number;
  closingCashActual?: number;
  closingBankActual?: number;
  pendingRazorpaySettlement?: number;
  expectedCash?: number;
  expectedBank?: number;
  cashDifference?: number;
  bankDifference?: number;
  totalRevenue?: number;
  totalExpenses?: number;
  netProfit?: number;
  ownerContributionToday?: number;
  ownerWithdrawalToday?: number;
  ownerBalanceClosing?: number;
  status: DailySessionStatus;
  notes?: string;
  adjustmentNotes?: string;
  needsRecalculation?: boolean;
  reopenedReason?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
};

export type PersonalExpenseCategory =
  | "Room Rent"
  | "Electricity"
  | "Water"
  | "Internet"
  | "Groceries"
  | "Food"
  | "Travel"
  | "Medical"
  | "Mobile Recharge"
  | "Laundry"
  | "Room Maintenance"
  | "Personal Shopping"
  | "Family"
  | "Savings"
  | "Loan/EMI"
  | "Other";

export const personalExpenseCategories: PersonalExpenseCategory[] = [
  "Room Rent",
  "Electricity",
  "Water",
  "Internet",
  "Groceries",
  "Food",
  "Travel",
  "Medical",
  "Mobile Recharge",
  "Laundry",
  "Room Maintenance",
  "Personal Shopping",
  "Family",
  "Savings",
  "Loan/EMI",
  "Other"
];

export type PersonalExpense = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: PersonalExpenseCategory;
  date: string;
  paidBy?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type Revenue = {
  id: string;
  userId: string;
  product: string;
  orders: number;
  amount: number;
  date: string;
  channel: "Store" | "Dine-in" | "Takeaway" | "WhatsApp" | "Phone" | "Marketplace" | "Website" | "Catering" | "Other";
  createdAt: string;
  source?: "manual" | "website";
  revenueSource?: string;
  revenueType?: "Food Sales" | "Delivery Fee" | "Catering" | "Party Order" | "Subscription" | "Commission" | "Refund Reversal" | "Other";
  paymentStatus?: string;
  paymentMethod?: string;
  orderStatus?: string;
  orderNumber?: string;
  customerName?: string;
  orderItems?: string;
  deliveryAddress?: string;
  paymentReference?: string;
  phone?: string;
  revenueState?: "net" | "pending" | "refunded" | "lost";
  notes?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type InventoryItem = {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  restockStatus: "Healthy" | "Watch" | "Restock";
  updatedAt: string;
  unitCost?: number;
  supplier?: string;
  lastStockAction?: "Stock In" | "Stock Out" | "Adjustment";
  purchaseHistory?: Array<{ date: string; quantity: number; unitCost?: number; supplier?: string }>;
};

export type Budget = {
  id: string;
  userId: string;
  category: ExpenseCategory;
  month: string;
  limit: number;
  spent: number;
};

export type BusinessProfile = {
  userId: string;
  ownerName: string;
  businessName: string;
  currency: string;
  theme: "dark" | "light";
};

export type AiInsight = {
  summary: string;
  warnings: string[];
  opportunities: string[];
  healthScore: number;
};

export type ReceiptExtraction = {
  amount?: number;
  vendor?: string;
  date?: string;
  category?: ExpenseCategory;
  rawText?: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  feedbackCount: number;
  averageRating: number;
  lifetimeValue: number;
};

export type FeedbackRecord = {
  id: string;
  customerName?: string;
  phone?: string;
  orderId?: string;
  orderNumber?: string;
  rating?: number;
  message?: string;
  comment?: string;
  sentiment?: "positive" | "neutral" | "negative" | string;
  feedbackType?: "order_feedback" | "general_feedback";
  createdAt?: { toDate?: () => Date } | string;
  highPriority?: boolean;
  ai?: { sentiment?: string; highPriority?: boolean; recommendedAction?: string };
};

export type NotificationItem = {
  id: string;
  type: "low_stock" | "new_order" | "new_feedback" | "budget_exceeded" | "revenue_milestone";
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical" | "success";
  createdAt: string;
};

export type RestaurantOrderStatus = "New" | "Accepted" | "Preparing" | "Ready" | "Completed" | "Cancelled" | "New Order" | "In Kitchen" | "Delivered";
export type RestaurantOrderType = "Dine In" | "Takeaway" | "Delivery";
export type RestaurantPaymentMethod = "Cash" | "UPI" | "Card" | "Online payment" | "Other";
export type RestaurantPaymentStatus = "Paid" | "Unpaid" | "Partially paid";
export type RestaurantPriority = "Normal" | "Priority" | "Urgent";
export type RestaurantRefundStatus = "No refund required" | "Refund pending" | "Refunded";

export type RestaurantMenuVariant = {
  name: string;
  price: number;
};

export type RestaurantMenuItem = {
  id: string;
  name: string;
  categoryId?: string;
  categoryName: string;
  description?: string;
  imageUrl?: string;
  available: boolean;
  variants: RestaurantMenuVariant[];
  productType?: "dish" | "combo";
};

export type RestaurantCartExtra = {
  id: string;
  name: string;
  price: number;
};

export type RestaurantCartCrust = {
  id: string;
  label: string;
  description?: string;
};

export type RestaurantOrderItem = {
  menuItemId: string;
  name: string;
  categoryName?: string;
  size?: string;
  baseUnitPrice?: number;
  unitPrice: number;
  extras?: RestaurantCartExtra[];
  addOns?: RestaurantCartExtra[];
  extrasTotal?: number;
  crust?: RestaurantCartCrust;
  crustType?: string;
  selectedCrust?: string;
  quantity: number;
  notes?: string;
  lineTotal: number;
};

export type RestaurantOfferCode = "NONE" | "OBGO" | "TBGO";

export type RestaurantOrder = {
  id: string;
  userId: string;
  orderNumber: string;
  customerName?: string;
  mobileNumber?: string;
  orderType: RestaurantOrderType;
  tableNumber?: string;
  items: RestaurantOrderItem[];
  notes?: string;
  offerCode?: RestaurantOfferCode;
  offerLabel?: string;
  discountAmount?: number;
  manualDiscountAmount?: number;
  manualDiscountType?: "flat" | "percent";
  subTotal?: number;
  taxAmount?: number;
  deliveryCharge?: number;
  packagingCharge?: number;
  paymentMethod: RestaurantPaymentMethod;
  paymentStatus: RestaurantPaymentStatus;
  amountReceived?: number;
  pendingAmount?: number;
  totalAmount: number;
  status: RestaurantOrderStatus;
  priority?: RestaurantPriority;
  deliveryAddress?: string;
  kitchenNotes?: string;
  cancellationReason?: string;
  refundStatus?: RestaurantRefundStatus;
  idempotencyKey?: string;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  preparingAt?: string;
  readyAt?: string;
  completedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  paidAt?: string;
};
