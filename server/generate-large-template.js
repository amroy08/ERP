const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function generateLargeTemplate() {
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
    'Address',
    'Academic Year' // Added for clarity/user record
  ];

  const firstNames = [
    'Aarav', 'Vihaan', 'Arjun', 'Kabir', 'Sai', 'Ishaan', 'Aanya', 'Diya', 'Riya', 'Kiara',
    'Aditya', 'Vivaan', 'Reyansh', 'Ayan', 'Atharv', 'Krishna', 'Avani', 'Myra', 'Ananya', 'Prisha',
    'Dhruv', 'Siddharth', 'Pranav', 'Rohan', 'Shaurya', 'Samarth', 'Saisha', 'Aaradhya', 'Anika', 'Ira',
    'Dev', 'Karan', 'Arnav', 'Rishi', 'Neil', 'Madhav', 'Pari', 'Sia', 'Zara', 'Meera',
    'Manish', 'Sanjay', 'Rahul', 'Amit', 'Rajesh', 'Vikram', 'Neha', 'Priya', 'Kiran', 'Aarti'
  ];

  const lastNames = [
    'Sharma', 'Patel', 'Verma', 'Gupta', 'Rao', 'Iyer', 'Nair', 'Kumar', 'Joshi', 'Mehta',
    'Singh', 'Chawla', 'Trivedi', 'Bose', 'Mukherjee', 'Reddy', 'Pillai', 'Deshmukh', 'Kulkarni', 'Naidu',
    'Shukla', 'Mishra', 'Pandey', 'Dubey', 'Yadav', 'Jha', 'Sen', 'Dutta', 'Das', 'Roy',
    'Kapoor', 'Khanna', 'Malhotra', 'Sethi', 'Anand', 'Gill', 'Sodhi', 'Dhillon', 'Grewal', 'Sandhu'
  ];

  const religions = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 'Jain'];
  const categories = ['General', 'OBC', 'SC', 'ST'];
  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune'];

  const data = [];
  const numStudents = 265; // Generate 265 students (> 250)

  for (let i = 1; i <= numStudents; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)] + i;
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const classNum = (i % 10) + 1; // Class 1 to Class 10
    const sec = i % 2 === 0 ? 'A' : 'B';
    const gender = Math.random() > 0.5 ? 'Male' : 'Female';
    
    // Generate random date between 2010 and 2018
    const birthYear = 2010 + Math.floor(Math.random() * 9);
    const birthMonth = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const birthDay = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    const dob = `${birthYear}-${birthMonth}-${birthDay}`;

    const rollNo = Math.floor((i - 1) / 10) + 1; // Distribute roll numbers

    const fatherFN = firstNames[Math.floor(Math.random() * firstNames.length)];
    const fatherLN = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fatherName = `${fatherFN} ${fatherLN}`;
    const fatherPhone = String(9000000000 + i);

    const motherFN = firstNames[Math.floor(Math.random() * firstNames.length)];
    const motherName = `${motherFN} ${fatherLN}`;
    const motherPhone = String(8000000000 + i);

    const aadhaar = String(100000000000 + i * 37);
    const religion = religions[Math.floor(Math.random() * religions.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const bg = bloodGroups[Math.floor(Math.random() * bloodGroups.length)];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const address = `${100 + i}, Main Street, ${city}`;

    data.push({
      'First Name': fn,
      'Last Name': ln,
      'Class': `Class ${classNum}`,
      'Section': sec,
      'Gender': gender,
      'Date of Birth': dob,
      'Roll Number': String(rollNo),
      'Father Name': fatherName,
      'Father Phone': fatherPhone,
      'Mother Name': motherName,
      'Mother Phone': motherPhone,
      'Aadhaar': aadhaar,
      'Religion': religion,
      'Category': category,
      'Blood Group': bg,
      'Address': address,
      'Academic Year': '2025-26' // Matches the academic year we created in DB
    });
  }

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // Create workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Students_Import_250');

  // Define output path directly on Desktop
  const desktopPath = '/Users/amroy/Desktop';
  const outputPath = path.join(desktopPath, 'Student_Import_250_Students.xlsx');

  console.log(`Writing template to: ${outputPath}`);
  XLSX.writeFile(wb, outputPath);
  console.log('Large template created successfully on your Desktop!');
}

generateLargeTemplate();
