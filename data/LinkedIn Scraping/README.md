# LinkedIn Scraper for UT Students

This script scrapes LinkedIn profiles for students listed in the `ut_students.csv` file and filters for those who have attended the University of Texas at Austin. The resulting profiles are saved to a CSV file.

## Prerequisites

- Python 3.6+
- Chrome browser
- A LinkedIn account

## Installation

1. Install the required packages:

```bash
pip install pandas selenium webdriver-manager linkedin-scraper
```

2. Make sure to have chromedriver installed or let the script install it for you.

```bash
export CHROMEDRIVER=~/chromedriver
```

## Usage

1. Run the script:

```bash
python main.py
```

2. Enter your LinkedIn credentials when prompted.

3. The script will:
   - Search for each student on LinkedIn
   - Check if their education includes UT Austin
   - Scrape their profile information
   - Save the results to a CSV file

## Features

- **Robust error handling**: The script will continue running even if individual profile scraping fails
- **Checkpoint saving**: Data is saved periodically to prevent data loss
- **Rate limiting prevention**: Random delays are added between requests to avoid being detected as a bot
- **Smart search**: Optimized search methodology to find the right profiles

## Output Files

The script generates several files:

- `ut_students_linkedin_profiles_checkpoint_*.csv`: Periodic checkpoints of scraped data
- `ut_students_linkedin_profiles_final.csv`: Final output with all successfully scraped profiles

## Output Data Format

Each row in the output CSV contains:

- Original Name: The name from the input CSV
- LinkedIn Name: The name as it appears on LinkedIn
- LinkedIn URL: The URL of the LinkedIn profile
- About: The about section from the profile
- Experiences: List of work experiences
- Educations: List of educational institutions attended
- Interests: List of interests
- Accomplishments: List of accomplishments
- Current Company: Current employer
- Current Job Title: Current job title

## Notes

- LinkedIn has rate limits and may temporarily block scraping activities if too many requests are made too quickly
- Using a premium LinkedIn account may help avoid some limitations
- Run the script with care to avoid your account being flagged

## Limitations

- The script can only scrape public information or information visible to your LinkedIn account
- LinkedIn's structure may change, potentially breaking the scraper
- Some profiles may not be found due to privacy settings or name variations 