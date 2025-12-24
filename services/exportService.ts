import { Lead } from "../types";

export const exportToCSV = (leads: Lead[], filename: string) => {
  if (!leads.length) return;

  const headers = [
    "Username",
    "Full Name",
    "Niche",
    "Email",
    "Phone",
    "Website",
    "Location",
    "Followers",
    "Category",
    "Engagement Score",
    "Source"
  ];

  // CSV formatting helper to handle quotes and commas within data
  const formatCell = (data: string | number | undefined | null) => {
    if (data === null || data === undefined) return '""';
    const str = String(data);
    // Escape double quotes by doubling them
    return `"${str.replace(/"/g, '""')}"`;
  };

  const rows = leads.map(lead => [
    formatCell(lead.username),
    formatCell(lead.fullName),
    formatCell(lead.niche),
    formatCell(lead.email),
    formatCell(lead.phone),
    formatCell(lead.website),
    formatCell(lead.location),
    formatCell(lead.followers),
    formatCell(lead.category),
    formatCell(lead.engagementScore),
    formatCell(lead.source)
  ]);

  const csvContent = [
    headers.map(h => formatCell(h)).join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");

  // Prepend BOM (\uFEFF) to ensure Excel opens the file as UTF-8 with correct column separation
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  // Using .csv is safer than .xls for text content, but BOM makes it open correctly in Excel
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};