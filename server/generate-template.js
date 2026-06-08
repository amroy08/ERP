const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function generateTemplate() {
  const headers = [
    'First Name', 
    'Last Name', 
    'Class', 
    'Section', 
    'Gender', 
    'Date of Birth', 
    'Roll Number', 
    'Father Name', 
    'Father Phone', 
    'Mother Name', 
    'Mother Phone', 
    'Aadhaar', 
    'Religion', 
    'Category', 
    'Blood Group', 
    'Address'
  ];

  const data = [
    {
      'First Name': 'Rahul',
      'Last Name': 'Sharma',
      'Class': 'Class 1',
      'Section': 'A',
      'Gender': 'Male',
      'Date of Birth': '2015-06-15',
      'Roll Number': '1',
      'Father Name': 'Rajesh Sharma',
      'Father Phone': '9876543210',
      'Mother Name': 'Priya Sharma',
      'Mother Phone': '9876543211',
      'Aadhaar': '123456789012',
      'Religion': 'Hindu',
      'Category': 'General',
      'Blood Group': 'B+',
      'Address': '123 Main Street, Mumbai'
    },
    {
      'First Name': 'Aanya',
      'Last Name': 'Patel',
      'Class': 'Class 2',
      'Section': 'B',
      'Gender': 'Female',
      'Date of Birth': '2014-08-22',
      'Roll Number': '2',
      'Father Name': 'Amit Patel',
      'Father Phone': '9876543220',
      'Mother Name': 'Neha Patel',
      'Mother Phone': '9876543221',
      'Aadhaar': '987654321098',
      'Religion': 'Hindu',
      'Category': 'General',
      'Blood Group': 'A+',
      'Address': '456 Park Road, Ahmedabad'
    }
  ];

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Import_Template');

  // Define desktop path
  const desktopPath = '/Users/amroy/Desktop';
  const outputPath = path.join(desktopPath, 'Student_Import_Template.xlsx');

  console.log(`Writing template to: ${outputPath}`);
  XLSX.writeFile(wb, outputPath);
  console.log('Template created successfully on your Desktop!');
}

generateTemplate();
