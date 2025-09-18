export function parseEmail(emailText) {
  const data = {
    company: null,
    orderId: null,
    orderDate: null,
    items: [],
    totalAmount: null
  };

  // Identify company from text
  const companies = ["Amazon", "Uber", "Flipkart", "Swiggy", "Zomato", "Ola", "Paytm", "Myntra", "Apple", "Netflix"];
  for (let c of companies) {
    if (emailText.toLowerCase().includes(c.toLowerCase())) {
      data.company = c;
      break;
    }
  }

  // Extract Order ID / Trip ID
  const idMatch = emailText.match(/(?:Order ID|Trip ID):?\s*([A-Za-z0-9\-]+)/i);
  if (idMatch) data.orderId = idMatch[1];

  // Extract Date
  const dateMatch = emailText.match(/(?:Order Date|Date):?\s*([0-9\-\/]+)/i);
  if (dateMatch) data.orderDate = dateMatch[1];

  // Extract Items (format: name | qty | price | total)
  const itemLines = emailText.split("\n").filter(line => /\|/.test(line) && /\d+/.test(line));
  for (let line of itemLines) {
    const parts = line.split("|").map(s => s.trim());
    if (parts.length >= 4) {
      data.items.push({
        name: parts[1],
        quantity: parseInt(parts[2]),
        price: parseFloat(parts[3]),
        total: parts[4] ? parseFloat(parts[4]) : parseFloat(parts[3])
      });
    }
  }

  // Extract Total Amount
  const totalMatch = emailText.match(/Total Amount[: ]+₹?([\d]+)/i);
  if (totalMatch) data.totalAmount = parseFloat(totalMatch[1]);

  return data;
}
