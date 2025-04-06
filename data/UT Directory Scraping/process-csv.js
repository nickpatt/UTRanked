const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

/**
 * Process the combined CSV file to extract only selected columns
 * and remove duplicate headers
 */
async function processCombinedFile(inputFile) {
  // If no input file is specified, look for the most recent combined file
  if (!inputFile) {
    const outputDir = path.join(__dirname, 'output');
    const combinedFiles = fs.readdirSync(outputDir)
      .filter(file => file.includes('combined') && file.endsWith('.csv'))
      .sort()
      .reverse(); // Sort descending to get most recent first
    
    if (combinedFiles.length === 0) {
      console.error('No combined CSV files found in the output directory.');
      return;
    }
    
    inputFile = path.join(outputDir, combinedFiles[0]);
    console.log(`Using most recent combined file: ${combinedFiles[0]}`);
  }
  
  // Ensure the input file exists
  if (!fs.existsSync(inputFile)) {
    console.error(`Input file not found: ${inputFile}`);
    return;
  }
  
  // Output file path
  const outputDir = path.dirname(inputFile);
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const outputFile = path.join(outputDir, `ut_degrees_simplified_${timestamp}.csv`);
  
  try {
    // Read the input file
    console.log(`Reading file: ${inputFile}`);
    const content = fs.readFileSync(inputFile, 'utf8');
    const lines = content.split('\n');
    
    // Parse the rows
    const records = [];
    const processedNames = new Set(); // To track duplicate names
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Skip header rows (they all have 'studentName' in quotes as first field)
      if (line.startsWith('"studentName"')) continue;
      
      // Parse the CSV row
      const row = parseCSVLine(line);
      
      // Skip if we couldn't parse the row
      if (!row) continue;
      
      const { studentName, majorName, degreeDate, firstSemester } = row;
      
      // Skip if already processed this name (assuming studentName is unique)
      if (processedNames.has(studentName)) continue;
      processedNames.add(studentName);
      
      // Add the simplified record
      records.push({
        studentName,
        majorName: majorName || '',
        degreeDate: degreeDate || '',
        firstSemester: firstSemester || ''
      });
    }
    
    console.log(`Processed ${records.length} unique student records`);
    
    // Define the fields for the output CSV
    const fields = ['studentName', 'majorName', 'degreeDate', 'firstSemester'];
    
    // Write the output file
    const parser = new Parser({ fields });
    const csv = parser.parse(records);
    fs.writeFileSync(outputFile, csv);
    
    console.log(`Simplified CSV saved to: ${outputFile}`);
    console.log(`Total records: ${records.length}`);
  } catch (error) {
    console.error('Error processing CSV file:', error);
  }
}

/**
 * Simple CSV line parser
 * Note: This is a basic implementation and may not handle all edge cases
 */
function parseCSVLine(line) {
  // Check if the line is a valid CSV row
  if (!line || !line.includes(',')) return null;
  
  // Split by commas, but respect quotes
  const fields = [];
  let field = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  
  // Add the last field
  fields.push(field);
  
  // Remove quotes from fields
  const cleanFields = fields.map(f => f.replace(/^"|"$/g, ''));
  
  // Return an object with the fields we care about
  if (cleanFields.length >= 9) {
    return {
      studentName: cleanFields[0],
      firstSemester: cleanFields[1],
      majorName: cleanFields[4],
      degreeDate: cleanFields[5]
    };
  }
  
  return null;
}

// Check if an input file was specified as a command line argument
const inputFile = process.argv[2];
processCombinedFile(inputFile).catch(console.error); 