"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/layout/Sidebar";
import SettingsNav from "@/components/settings/SettingsNav";
import { api, Invoice, PaymentMethod, NextBilling } from "@/lib/api";
import {
  FileText,
  RefreshCw,
  CreditCard,
  Download,
  ExternalLink,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";

export default function BillingHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [nextBilling, setNextBilling] = useState<NextBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [invoicesRes, pmRes, nbRes] = await Promise.all([
        api.getInvoices(20),
        api.getPaymentMethod(),
        api.getNextBilling(),
      ]);

      setInvoices(invoicesRes.invoices);
      setPaymentMethod(pmRes.payment_method);
      setNextBilling(nbRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "bg-emerald-500/10 text-emerald-400",
      open: "bg-yellow-500/10 text-yellow-400",
      draft: "bg-gray-500/10 text-gray-400",
      uncollectible: "bg-red-500/10 text-red-400",
      void: "bg-gray-500/10 text-gray-400",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || styles.draft
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCardBrandIcon = (brand: string) => {
    // Simple text representation, could be replaced with actual card icons
    const brands: Record<string, string> = {
      visa: "Visa",
      mastercard: "Mastercard",
      amex: "Amex",
      discover: "Discover",
    };
    return brands[brand.toLowerCase()] || brand;
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar />

      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/settings/billing"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Billing
            </Link>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <FileText className="w-7 h-7" />
              Billing History
            </h1>
            <p className="text-gray-400 mt-1">
              View your invoices and payment method
            </p>
          </div>

          <SettingsNav />

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-3 text-gray-400">Loading billing data...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Payment Method & Next Billing */}
              <div className="grid sm:grid-cols-2 gap-6">
                {/* Payment Method */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    Payment Method
                  </h2>

                  {paymentMethod ? (
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-br from-gray-600 to-gray-800 rounded flex items-center justify-center text-xs text-white font-bold">
                        {getCardBrandIcon(paymentMethod.card.brand)}
                      </div>
                      <div>
                        <p className="text-white">
                          {paymentMethod.card.brand.charAt(0).toUpperCase() +
                            paymentMethod.card.brand.slice(1)}{" "}
                          ending in {paymentMethod.card.last4}
                        </p>
                        <p className="text-sm text-gray-400">
                          Expires {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No payment method on file</p>
                  )}
                </div>

                {/* Next Billing */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Next Billing
                  </h2>

                  {nextBilling && nextBilling.next_billing_date ? (
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(nextBilling.amount, nextBilling.currency)}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        on {formatDate(nextBilling.next_billing_date)}
                      </p>
                      {nextBilling.cancel_at_period_end && (
                        <p className="text-xs text-yellow-400 mt-2 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Cancels at period end
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm">No upcoming billing</p>
                  )}
                </div>
              </div>

              {/* Invoice History */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    Invoice History
                  </h2>
                </div>

                {invoices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Invoice
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-white/5">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-white font-medium">
                                {invoice.number || invoice.id.slice(0, 8)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                              {formatDate(invoice.created)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-white">
                                {formatCurrency(invoice.amount_paid || invoice.amount_due, invoice.currency)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getStatusBadge(invoice.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                {invoice.invoice_pdf && (
                                  <a
                                    href={invoice.invoice_pdf}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="Download PDF"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                )}
                                {invoice.hosted_invoice_url && (
                                  <a
                                    href={invoice.hosted_invoice_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    title="View Invoice"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No invoices yet</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Your invoices will appear here once you subscribe to a paid plan
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
