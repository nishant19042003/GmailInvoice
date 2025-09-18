// methods/Filter.js
export function isInvoiceEmail(email) {
  // Check subject & snippet
  const subject = email.payload.headers.find(h => h.name === "Subject")?.value.toLowerCase() || "";
  const snippet = (email.snippet || "").toLowerCase();

  const keywords = ["invoice", "receipt", "bill", "statement", "payment"];
  if (keywords.some(kw => subject.includes(kw) || snippet.includes(kw))) {
    return true;
  }

  // Check attachments
  const parts = email.payload.parts || [];
  for (let part of parts) {
    if (part.mimeType === "application/pdf" && 
        /invoice|receipt|bill|statement/i.test(part.filename)) {
      return true;
    }
  }

  return false;
}
