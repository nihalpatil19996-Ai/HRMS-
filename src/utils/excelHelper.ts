import * as XLSX from 'xlsx';
import { Lead } from '../types/crm';

export interface ParsedLeadRow {
  customerName: string;
  mobile: string;
  product: string;
  city?: string;
  state?: string;
  remarks?: string;
}

// Sample CSV / Excel Download
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Client Name': 'Rajesh Sharma',
      'Mobile Number': '9876543210',
      'Product Section': 'Share Market Sales',
      'City': 'Mumbai',
      'State': 'Maharashtra',
      'Remarks': 'Interested in Equity Trading account',
    },
    {
      'Client Name': 'Priya Patel',
      'Mobile Number': '9123456789',
      'Product Section': 'Health Insurance Sales',
      'City': 'Ahmedabad',
      'State': 'Gujarat',
      'Remarks': 'Wants family floater policy quote',
    },
    {
      'Client Name': 'Amit Verma',
      'Mobile Number': '8888211123',
      'Product Section': 'Mutual Funds',
      'City': 'Delhi',
      'State': 'Delhi',
      'Remarks': 'Looking for SIP investment options',
    },
    {
      'Client Name': 'Sunita Rao',
      'Mobile Number': '9900088122',
      'Product Section': 'Personal Loan',
      'City': 'Bengaluru',
      'State': 'Karnataka',
      'Remarks': 'Pre-approved loan requirement',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Client Name
    { wch: 15 }, // Mobile Number
    { wch: 25 }, // Product Section
    { wch: 15 }, // City
    { wch: 15 }, // State
    { wch: 35 }, // Remarks
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample Leads');

  // Trigger download
  XLSX.writeFile(workbook, 'DialerCRM_Sample_Leads_Template.xlsx');
}

// Parse Excel / CSV File
export async function parseExcelOrCsvFile(file: File): Promise<ParsedLeadRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const jsonRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const parsedLeads: ParsedLeadRow[] = jsonRows.map((row) => {
          // Normalize header keys
          const keys = Object.keys(row);

          const findValue = (possibleHeaders: string[]): string => {
            const key = keys.find((k) =>
              possibleHeaders.some((ph) => k.toLowerCase().trim().includes(ph.toLowerCase()))
            );
            return key ? String(row[key]).trim() : '';
          };

          const name =
            findValue(['client name', 'customer name', 'lead name', 'name', 'client']) ||
            'Client Lead';
          let mobile =
            findValue(['mobile number', 'mobile', 'phone', 'contact', 'number', 'cell']) ||
            '';

          // Clean mobile number (keep numbers)
          mobile = mobile.replace(/[^\d+]/g, '');
          if (mobile.length === 10 && !mobile.startsWith('+')) {
            mobile = `+91 ${mobile}`;
          }

          const product =
            findValue(['product section', 'product', 'category', 'segment', 'service']) ||
            'General Sales';

          const city = findValue(['city', 'location', 'district']) || 'Metro';
          const state = findValue(['state', 'region']) || 'India';
          const remarks = findValue(['remarks', 'note', 'comment', 'description']) || 'Imported lead';

          return {
            customerName: name,
            mobile: mobile || '+91 90000 00000',
            product,
            city,
            state,
            remarks,
          };
        });

        // Filter out empty rows
        const validLeads = parsedLeads.filter((l) => l.customerName && l.mobile);
        resolve(validLeads);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}
