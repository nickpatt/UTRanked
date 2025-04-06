/**
 * Utility script to combine multiple CSV files into one
 */
const fs = require('fs');
const path = require('path');

async function combineOutputFiles(inputFiles = []) {
  const outputDir = path.join(__dirname, 'output');
  
  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    console.log('Output directory not found. Creating it...');
    fs.mkdirSync(outputDir);
    return;
  }
  
  // If no specific files are provided, find all CSV files in the output directory
  if (inputFiles.length === 0) {
    const files = fs.readdirSync(outputDir).filter(file => 
      file.endsWith('.csv') && !file.includes('combined') && !file.includes('simplified')
    );
    
    if (files.length === 0) {
      console.log('No CSV files found to combine.');
      return;
    }
    
    inputFiles = files.map(file => path.join(outputDir, file));
    console.log(`Found ${inputFiles.length} CSV files to combine.`);
  } else {
    // Verify all input files exist
    const missingFiles = inputFiles.filter(file => !fs.existsSync(file));
    if (missingFiles.length > 0) {
      console.error('The following files were not found:');
      missingFiles.forEach(file => console.error(`  - ${file}`));
      return;
    }
    
    console.log(`Combining ${inputFiles.length} specified CSV files.`);
  }
  
  // Name for the combined file
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const combinedFilePath = path.join(outputDir, `ut_degrees_combined_${timestamp}.csv`);
  const combinedStream = fs.createWriteStream(combinedFilePath);
  
  // Get header from the first file
  const firstFile = inputFiles[0];
  const headerLine = fs.readFileSync(firstFile, 'utf8').split('\n')[0];
  combinedStream.write(headerLine + '\n');
  
  // Track unique records to avoid duplicates
  const processedRecords = new Set();
  
  // Append data from all files (skipping headers)
  let totalRecords = 0;
  let skippedDuplicates = 0;
  
  for (const file of inputFiles) {
    console.log(`Processing: ${path.basename(file)}`);
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.split('\n').slice(1).filter(line => line.trim());
      
      let fileRecords = 0;
      for (const line of lines) {
        // Skip duplicate records - use the CSV line as a unique identifier
        if (processedRecords.has(line)) {
          skippedDuplicates++;
          continue;
        }
        
        processedRecords.add(line);
        combinedStream.write(line + '\n');
        totalRecords++;
        fileRecords++;
      }
      
      console.log(`  Added ${fileRecords} unique records from ${path.basename(file)}`);
      
    } catch (error) {
      console.error(`  Error processing file ${file}: ${error.message}`);
    }
  }
  
  combinedStream.end();
  console.log(`\nCombination complete!`);
  console.log(`Total unique records combined: ${totalRecords}`);
  console.log(`Duplicate records skipped: ${skippedDuplicates}`);
  console.log(`Combined file saved to: ${combinedFilePath}`);
}

// Get input files from command line arguments
const args = process.argv.slice(2);
const inputFiles = args.length > 0 ? args : [];

// Run the combine function
combineOutputFiles(inputFiles).catch(error => {
  console.error('An error occurred during file combination:', error);
}); 