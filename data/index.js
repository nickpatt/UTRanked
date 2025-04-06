const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

/**
 * Script to scrape degree information from UT Austin's degree and attendance website
 * This script can be run in parallel with different starting letters
 */
async function scrapeUTDegreeData(startLetter = 'a', endLetter = null) {
  // Create CSV directory if it doesn't exist
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // CSV file path with timestamp and startLetter
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const letterRange = endLetter ? `${startLetter}-${endLetter}` : startLetter;
  const csvFilePath = path.join(outputDir, `ut_degrees_${letterRange}_${timestamp}.csv`);
  
  // CSV fields
  const fields = [
    'studentName',
    'firstSemester',
    'lastSemester',
    'degreeName',
    'majorName',
    'degreeDate',
    'honorsReceived',
    'specialHonorsReceived',
    'degreeNotes'
  ];

  // Create write stream for CSV
  const csvStream = fs.createWriteStream(csvFilePath);
  
  // Write CSV header
  const parser = new Parser({ fields });
  csvStream.write(parser.parse([]) + '\n');

  // Launch browser
  console.log(`Launching browser for range ${letterRange}...`);
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production, false for debugging
    defaultViewport: null,
    args: ['--start-maximized']
  });

  try {
    // Create new page and go to the degrees page
    const page = await browser.newPage();
    
    console.log(`Navigating to the degrees page for range ${letterRange}...`);
    await page.goto('https://utdirect.utexas.edu/apps/degree/degrees/nlogon/');

    // Wait for user to manually authenticate if needed
    console.log('Waiting for authentication... (Press any key in the console when authenticated)');
    await waitForKeyPress();
    
    // Start with the provided letter to get initial results
    console.log(`Starting data collection for range ${letterRange}...`);
    await page.type('#s_start_name', startLetter);
    await Promise.all([
      page.click('#s_start_page'),
      page.waitForNavigation({ waitUntil: 'networkidle0' })
    ]);

    let pageNumber = 1;
    let hasNextPage = true;
    let totalRecords = 0;
    let shouldContinue = true;

    // Continue scraping while there's a next page and we haven't reached the end letter
    while (hasNextPage && shouldContinue) {
      console.log(`Scraping page ${pageNumber} for range ${letterRange}...`);
      
      // Extract data from the current page
      const pageData = await extractPageData(page);
      
      // Check if we've reached the end letter
      if (endLetter && pageData.length > 0) {
        const lastNameOnPage = pageData[pageData.length - 1].studentName.split(' ')[0];
        if (lastNameOnPage.toLowerCase()[0] > endLetter.toLowerCase()) {
          console.log(`Reached end letter ${endLetter}. Stopping.`);
          shouldContinue = false;
          
          // Filter out records that are past our end letter
          const filteredData = pageData.filter(record => {
            const lastName = record.studentName.split(' ')[0];
            return lastName.toLowerCase()[0] <= endLetter.toLowerCase();
          });
          
          // Write filtered data to CSV
          if (filteredData.length > 0) {
            for (const record of filteredData) {
              csvStream.write(parser.parse([record]) + '\n');
            }
            totalRecords += filteredData.length;
          }
          
          break;
        }
      }
      
      // Write data to CSV
      if (pageData.length > 0) {
        for (const record of pageData) {
          csvStream.write(parser.parse([record]) + '\n');
        }
        totalRecords += pageData.length;
        console.log(`Extracted ${pageData.length} records from page ${pageNumber} for range ${letterRange}. Total records: ${totalRecords}`);
      } else {
        console.log(`No records found on page ${pageNumber} for range ${letterRange}.`);
      }

      // Check if there's a next page
      hasNextPage = await hasNextPageButton(page);
      if (hasNextPage) {
        pageNumber++;
        // Click next page and wait for navigation
        await Promise.all([
          page.click('#s_next_page_1'),
          page.waitForNavigation({ waitUntil: 'networkidle0' })
        ]);
      }
    }

    console.log(`Scraping complete for range ${letterRange}! Total records: ${totalRecords}`);
    console.log(`Data saved to: ${csvFilePath}`);
    
  } catch (error) {
    console.error(`An error occurred during scraping range ${letterRange}:`, error);
  } finally {
    // Close CSV stream
    csvStream.end();
    
    // Close browser
    await browser.close();
    console.log(`Browser closed for range ${letterRange}.`);
  }
}

/**
 * Extract student data from the current page
 */
async function extractPageData(page) {
  return await page.evaluate(() => {
    const records = [];
    const students = document.querySelectorAll('.student_main_info');
    
    students.forEach(student => {
      // Get student basic info
      const studentName = student.querySelector('.student_name')?.textContent.trim() || '';
      const firstSemester = student.querySelector('.first_sem')?.textContent.replace('first semester', '').trim() || '';
      const lastSemester = student.querySelector('.last_sem')?.textContent.replace('last semester', '').trim() || '';
      
      // Skip if last semester is not Spring 2025
      if (lastSemester !== 'Spring 2025') {
        return;
      }
      
      // Initialize with basic info
      let studentRecord = {
        studentName,
        firstSemester,
        lastSemester,
        degreeName: '',
        majorName: '',
        degreeDate: '',
        honorsReceived: '',
        specialHonorsReceived: '',
        degreeNotes: ''
      };
      
      // Get degree info (if any)
      let currentNode = student.nextElementSibling;
      let hasDegree = false;
      
      // Loop through sibling elements until we hit the next student or the end
      while (currentNode && !currentNode.classList.contains('student_main_info') && !currentNode.classList.contains('filler')) {
        // Check if this is a degree row
        if (currentNode.querySelector('.degree_name')) {
          // If we already have a degree for this student, push the record and create a new one
          if (hasDegree) {
            records.push({...studentRecord});
            // Reset degree-related fields but keep student info
            studentRecord.degreeName = '';
            studentRecord.majorName = '';
            studentRecord.degreeDate = '';
            studentRecord.honorsReceived = '';
            studentRecord.specialHonorsReceived = '';
            studentRecord.degreeNotes = '';
          }
          
          // Extract degree info
          studentRecord.degreeName = currentNode.querySelector('.degree_name')?.textContent.trim() || '';
          studentRecord.majorName = currentNode.querySelector('.major_name')?.textContent.replace('major', '').trim() || '';
          studentRecord.degreeDate = currentNode.querySelector('.degree_date')?.textContent.trim() || '';
          
          // Look for honors in this row
          studentRecord.honorsReceived = currentNode.querySelector('.honors')?.textContent.trim() || '';
          studentRecord.specialHonorsReceived = currentNode.querySelector('.sp_honors')?.textContent.trim() || '';
          studentRecord.degreeNotes = currentNode.querySelector('.degree_note')?.textContent.trim() || '';
          
          hasDegree = true;
        }
        
        // Move to next node
        currentNode = currentNode.nextElementSibling;
      }
      
      // Add the student record if it has degree info or if there are no degrees (still want to record the student)
      if (hasDegree || !records.some(r => r.studentName === studentName)) {
        records.push({...studentRecord});
      }
    });
    
    return records;
  });
}

/**
 * Check if there's a next page button
 */
async function hasNextPageButton(page) {
  return await page.evaluate(() => {
    const nextButton = document.querySelector('#s_next_page_1');
    // Check if button exists and is not disabled
    return nextButton && !nextButton.disabled;
  });
}

/**
 * Utility function to wait for a keypress
 */
function waitForKeyPress() {
  return new Promise(resolve => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
}

/**
 * Combines multiple CSV files into one
 */
async function combineOutputFiles() {
  const outputDir = path.join(__dirname, 'output');
  const files = fs.readdirSync(outputDir).filter(file => file.endsWith('.csv'));
  
  if (files.length === 0) {
    console.log('No output files found to combine.');
    return;
  }
  
  // Name for the combined file
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  const combinedFilePath = path.join(outputDir, `ut_degrees_combined_${timestamp}.csv`);
  const combinedStream = fs.createWriteStream(combinedFilePath);
  
  // Get header from the first file
  const firstFile = path.join(outputDir, files[0]);
  const headerLine = fs.readFileSync(firstFile, 'utf8').split('\n')[0];
  combinedStream.write(headerLine + '\n');
  
  // Append data from all files (skipping headers)
  let totalRecords = 0;
  for (const file of files) {
    if (file.includes('combined')) continue; // Skip any previously combined files
    
    const filePath = path.join(outputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').slice(1).filter(line => line.trim());
    
    for (const line of lines) {
      combinedStream.write(line + '\n');
      totalRecords++;
    }
    
    console.log(`Added ${lines.length} records from ${file}`);
  }
  
  combinedStream.end();
  console.log(`Combined ${totalRecords} records into ${combinedFilePath}`);
}

/**
 * Parse command line arguments and run the scraper
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Check for combine command
  if (args[0] === 'combine') {
    await combineOutputFiles();
    return;
  }
  
  // Check for parallel command
  if (args[0] === 'parallel') {
    // Define individual letters for parallel processing
    const letters = 'abcdefghijklmnopqrstuvwxyz'.split('');
    // Whether to stagger the start of processes
    const staggeredStart = args[1] === 'staggered';
    const staggerDelay = staggeredStart ? 5000 : 0; // 5 seconds delay between processes if staggered
    
    console.log(`Starting parallel scraping with ${letters.length} processes (one per letter)...`);
    console.log(`Staggered start: ${staggeredStart ? 'Yes - ' + (staggerDelay/1000) + ' seconds between processes' : 'No'}`);
    
    // Launch processes for each letter
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      
      const child = require('child_process').spawn(
        'node', 
        [__filename, letter], 
        { stdio: 'inherit' }
      );
      
      console.log(`Started process for letter '${letter}' with PID ${child.pid}`);
      
      // Add delay between process starts if staggered option is enabled
      if (staggeredStart && i < letters.length - 1) {
        await new Promise(resolve => setTimeout(resolve, staggerDelay));
      }
    }
    
    return;
  }
  
  // Standard execution with optional letter range
  const startLetter = args[0] || 'a';
  const endLetter = args[1] || null;
  
  await scrapeUTDegreeData(startLetter, endLetter);
}

// Run the appropriate function based on command line arguments
main().catch(console.error);