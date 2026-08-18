export const formatRupiah = (number) => {
  if (number === undefined || number === null) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(number);
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch (e) {
    return dateStr;
  }
};

export const formatTime = (timeStr) => {
  if (!timeStr) return "-";
  return timeStr.substring(0, 5);
};

export const getStatusBadge = (status) => {
  switch (status) {
    case "booked":
      return {
        label: "Terjadwal",
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        dot: "bg-amber-500",
      };
    case "on_going":
      return {
        label: "Sedang Perawatan",
        bg: "bg-blue-50 text-blue-700 border-blue-200",
        dot: "bg-blue-500",
      };
    case "completed":
      return {
        label: "Selesai",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dot: "bg-emerald-500",
      };
    case "cancelled":
      return {
        label: "Dibatalkan",
        bg: "bg-rose-50 text-rose-700 border-rose-200",
        dot: "bg-rose-500",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-100 text-slate-700 border-slate-200",
        dot: "bg-slate-400",
      };
  }
};

export const getPaymentStatusBadge = (status) => {
  switch (status) {
    case "paid":
      return {
        label: "Lunas",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
      };
    case "dp":
      return {
        label: "DP (Sebagian)",
        bg: "bg-purple-100 text-purple-800 border-purple-300",
      };
    case "unpaid":
      return {
        label: "Belum Bayar",
        bg: "bg-rose-100 text-rose-800 border-rose-300",
      };
    default:
      return {
        label: status,
        bg: "bg-slate-100 text-slate-700 border-slate-300",
      };
  }
};

export const generateWhatsAppInvoiceMessage = (booking, studioSettings) => {
  if (!booking) return "";
  const itemsText = (booking.items || [])
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.treatment_name}* (${item.quantity}x) = ${formatRupiah(item.subtotal)}`
    )
    .join("\n");

  const studioName = studioSettings?.studio_name || "DD Beauty Serve";
  const studioPhone = studioSettings?.phone || "0812-8899-7722";
  const studioAddress = studioSettings?.address || "";

  return `✨ *INVOICE & BUKTI RESERVASI - ${studioName.toUpperCase()}* ✨
-----------------------------------------
Halo Kak *${booking.customer?.name || "Pelanggan Setia"}*,
Terima kasih telah mempercayakan perawatan kecantikan Anda di *${studioName}*.

🧾 *No. Invoice:* ${booking.invoice_number}
📅 *Tanggal:* ${formatDate(booking.booking_date)}
⏰ *Waktu:* ${formatTime(booking.booking_time)} WIB
💆‍♀️ *Terapis / Beautician:* ${booking.beautician_name || "Staff On Duty"}

📋 *Rincian Treatment:*
${itemsText}

-----------------------------------------
💰 *Subtotal:* ${formatRupiah(booking.subtotal)}
🏷️ *Diskon:* ${booking.discount_amount > 0 ? `-${formatRupiah(booking.discount_amount)}` : "Rp 0"}
✨ *Grand Total:* *${formatRupiah(booking.grand_total)}*
💵 *Telah Dibayar (DP/Lunas):* ${formatRupiah(booking.paid_amount)}
💳 *Sisa Tagihan:* *${formatRupiah(booking.remaining_amount)}*
📌 *Status Pembayaran:* *${booking.payment_status === "paid" ? "LUNAS ✅" : booking.payment_status === "dp" ? "DP (SEBAGIAN) ⏳" : "BELUM BAYAR ❌"}*
💳 *Metode:* ${booking.payment_method?.toUpperCase()}

${booking.remaining_amount > 0 ? `⚠️ *Sisa pembayaran dapat dilunasi saat selesai treatment di studio.*` : `✅ *Pembayaran telah lunas.*`}

📍 *Lokasi Studio:*
${studioAddress}
📞 Info & Reschedule: ${studioPhone}

_Sampai jumpa di perawatan berikutnya untuk pancaran cantik alami Anda!_ ✨`;
};
