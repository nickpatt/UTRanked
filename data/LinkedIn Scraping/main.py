import csv
import time
import os
import pandas as pd
import random
import re
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from linkedin_scraper import Person, actions
from webdriver_manager.chrome import ChromeDriverManager

# Get the absolute path of the script directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Set up the Chrome driver
def setup_driver():
    chrome_options = Options()
    # Uncomment the line below to run in headless mode
    # chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option("useAutomationExtension", False)
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    
    # Execute CDP commands to mask automation
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    driver.execute_cdp_cmd('Network.setUserAgentOverride', {"userAgent": 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'})
    
    return driver

# Login to LinkedIn
def login_to_linkedin(driver, email, password):
    try:
        print("Logging in to LinkedIn...")
        driver.get("https://www.linkedin.com/login")
        time.sleep(3)  # Wait for page to load
        
        # Check if we're on the login page
        if "login" in driver.current_url:
            # Fill in email and password
            email_field = driver.find_element(By.ID, "username")
            password_field = driver.find_element(By.ID, "password")
            
            # Clear fields first
            email_field.clear()
            password_field.clear()
            
            # Type slowly like a human would
            for char in email:
                email_field.send_keys(char)
                time.sleep(random.uniform(0.05, 0.1))
            
            for char in password:
                password_field.send_keys(char)
                time.sleep(random.uniform(0.05, 0.1))
            
            # Click login button
            driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
            
            # Wait for login to complete
            time.sleep(5)
            
            print("Successfully logged in to LinkedIn")
        else:
            # Try standard actions login as fallback
            actions.login(driver, email, password)
            print("Successfully logged in to LinkedIn using fallback method")
            time.sleep(5)  # Wait for login to complete
    except Exception as e:
        print(f"Failed to login: {e}")
        driver.quit()
        exit(1)

# Check if the education contains UT Austin
def is_ut_student(educations):
    ut_keywords = ["UT", "University of Texas", "The University of Texas at Austin"]
    for education in educations:
        education_str = str(education).lower()
        if any(keyword.lower() in education_str for keyword in ut_keywords):
            return True
    return False

# Convert complex objects to serializable format
def convert_to_serializable(obj):
    if isinstance(obj, list):
        return "; ".join([str(item) for item in obj])
    return str(obj)

# Random sleep to avoid rate limiting
def random_sleep(min_time=2, max_time=5):
    sleep_time = random.uniform(min_time, max_time)
    print(f"Sleeping for {sleep_time:.2f} seconds")
    time.sleep(sleep_time)

# Format student name for search
def format_name_for_search(name):
    # Remove special characters and normalize the name
    formatted_name = re.sub(r'[^\w\s]', '', name)
    formatted_name = formatted_name.replace(',', ' ')
    formatted_name = ' '.join(formatted_name.split())  # Normalize whitespace
    return formatted_name

# Perform LinkedIn search and get profile URLs
def search_linkedin(driver, student_name):
    formatted_name = format_name_for_search(student_name)
    encoded_name = quote(formatted_name)
    # Use the UT Austin school filter URL provided
    search_url = f"https://www.linkedin.com/search/results/people/?keywords={encoded_name}&origin=FACETED_SEARCH&schoolFilter=%5B%223162%22%5D"
    
    try:
        print(f"Searching for: {formatted_name} at UT Austin")
        driver.get(search_url)
        
        # Add a longer wait time
        time.sleep(random.uniform(3, 5))
        
        # Check if we need to login again
        if "login" in driver.current_url:
            print("Login page detected. Please check if you're properly logged in.")
            return None
        
        # Check for CAPTCHA or security checks
        page_source = driver.page_source.lower()
        if "captcha" in page_source or "security check" in page_source or "security verification" in page_source:
            print("CAPTCHA or security check detected. Please solve it manually and press Enter to continue.")
            input()
            # Refresh the page after solving CAPTCHA
            driver.get(search_url)
            time.sleep(3)
        
        # Try different selectors based on LinkedIn's layout
        search_result_selectors = [
            ".search-result__info a.search-result__result-link",
            ".entity-result__title a",
            ".reusable-search__result-container a.app-aware-link",
            "li.reusable-search__result-container a",
            ".search-results__list a",
            ".entity-result__title-text a"
        ]
        
        for selector in search_result_selectors:
            try:
                # Scroll down a bit to load content
                driver.execute_script("window.scrollBy(0, 300)")
                time.sleep(1)
                
                # Try to find elements
                profile_links = driver.find_elements(By.CSS_SELECTOR, selector)
                if profile_links:
                    # Get href attribute from the first result
                    profile_url = profile_links[0].get_attribute("href")
                    # Clean up the URL to remove tracking parameters
                    profile_url = profile_url.split("?")[0]
                    return profile_url
            except NoSuchElementException:
                continue
            except WebDriverException as e:
                print(f"WebDriver error: {e}")
                continue
        
        # If no selectors worked, try to find any link that looks like a profile
        try:
            links = driver.find_elements(By.TAG_NAME, "a")
            for link in links:
                href = link.get_attribute("href")
                if href and "/in/" in href:
                    profile_url = href.split("?")[0]
                    return profile_url
        except Exception as e:
            print(f"Error finding profile links: {e}")
        
        print(f"No search results found for {student_name}")
        # Save screenshot for debugging
        screenshot_path = os.path.join(SCRIPT_DIR, f"search_error_{formatted_name.replace(' ', '_')}.png")
        driver.save_screenshot(screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")
        return None
    
    except Exception as e:
        print(f"Error searching for {student_name}: {e}")
        # Save screenshot for debugging
        screenshot_path = os.path.join(SCRIPT_DIR, f"error_{formatted_name.replace(' ', '_')}.png")
        try:
            driver.save_screenshot(screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")
        except:
            print("Could not save screenshot")
        return None

# Scrape LinkedIn profile for a student
def scrape_profile(driver, student_name):
    try:
        # Search for the student on LinkedIn
        profile_url = search_linkedin(driver, student_name)
        
        if not profile_url:
            return None
        
        print(f"Found profile URL: {profile_url}")
        
        # Scrape the profile
        try:
            person = Person(profile_url, driver=driver, scrape=False)
            person.scrape(close_on_complete=False)
            random_sleep(3, 6)
            
            # No need to check for UT education since we're already filtering for UT students in the search
            
            # Return the profile data
            profile_data = {
                "Original Name": student_name,
                "LinkedIn Name": person.name,
                "LinkedIn URL": profile_url,
                "About": person.about,
                "Experiences": person.experiences,
                "Educations": person.educations,
                "Interests": person.interests,
                "Accomplishments": person.accomplishments,
                "Current Company": person.company,
                "Current Job Title": person.job_title
            }
            
            print(f"Successfully scraped profile for {student_name}")
            return profile_data
            
        except Exception as e:
            print(f"Error scraping profile for {student_name}: {e}")
            return None
            
    except Exception as e:
        print(f"Error in scrape_profile for {student_name}: {e}")
        return None

# Save profiles to CSV periodically
def save_profiles_checkpoint(profiles, checkpoint_number):
    if not profiles:
        print("No profiles to save")
        return
    
    # Convert complex objects to serializable format
    serializable_profiles = []
    for profile in profiles:
        serializable_profile = {}
        for key, value in profile.items():
            serializable_profile[key] = convert_to_serializable(value)
        serializable_profiles.append(serializable_profile)
    
    # Convert the profiles to a DataFrame
    profiles_df = pd.DataFrame(serializable_profiles)
    
    # Save to CSV
    checkpoint_file = os.path.join(SCRIPT_DIR, f"ut_students_linkedin_profiles_checkpoint_{checkpoint_number}.csv")
    profiles_df.to_csv(checkpoint_file, index=False)
    print(f"Saved checkpoint {checkpoint_number} with {len(profiles)} profiles to {checkpoint_file}")

# Main function
def main():
    # LinkedIn credentials
    linkedin_email = "your_email@example.com"  # Replace with your actual email
    linkedin_password = "your_password"  # Replace with your actual password
    
    # Or uncomment these lines to input credentials at runtime
    linkedin_email = input("Enter your LinkedIn email: ")
    linkedin_password = input("Enter your LinkedIn password: ")
    
    # Set up the driver and login
    driver = setup_driver()
    login_to_linkedin(driver, linkedin_email, linkedin_password)
    
    # Read the student data using absolute path
    students_csv_path = os.path.join(SCRIPT_DIR, "ut_students.csv")
    print(f"Reading student data from: {students_csv_path}")
    
    if not os.path.exists(students_csv_path):
        print(f"ERROR: CSV file not found at {students_csv_path}")
        print("Current directory:", os.getcwd())
        print("Files in directory:", os.listdir(SCRIPT_DIR))
        driver.quit()
        return
    
    students_df = pd.read_csv(students_csv_path)
    
    # Create a list to store the profiles
    profiles = []
    
    # Limit the number of students to scrape to avoid rate limiting
    max_students = 20000  # Reduced from 100 for initial testing
    checkpoint_interval = 5  # Save after every 5 successful scrapes
    
    # Track successful scrapes
    successful_scrapes = 0
    checkpoint_count = 0
    
    try:
        # Scrape profiles for each student
        for i, row in students_df.head(max_students).iterrows():
            student_name = row["studentName"]
            print(f"\nScraping profile for {student_name} ({i+1}/{min(max_students, len(students_df))})")
            
            try:
                profile_data = scrape_profile(driver, student_name)
                if profile_data:
                    profiles.append(profile_data)
                    successful_scrapes += 1
                    
                    # Save checkpoint if needed
                    if successful_scrapes % checkpoint_interval == 0:
                        checkpoint_count += 1
                        save_profiles_checkpoint(profiles, checkpoint_count)
                
                # Add a random delay to avoid being rate-limited by LinkedIn
                random_sleep(5, 10)
                
            except Exception as e:
                print(f"Error processing {student_name}: {e}")
                # If we encounter an error, save what we have so far
                if profiles:
                    save_profiles_checkpoint(profiles, f"error_{i}")
                # Add a longer delay if we hit an error
                random_sleep(15, 30)
    
    except KeyboardInterrupt:
        print("\nScript interrupted by user. Saving current progress...")
        if profiles:
            save_profiles_checkpoint(profiles, "interrupted")
    
    finally:
        # Close the driver
        driver.quit()
        
        # Save the final profiles to a CSV file
        if profiles:
            output_file = os.path.join(SCRIPT_DIR, "ut_students_linkedin_profiles_final.csv")
            
            # Convert complex objects to serializable format
            serializable_profiles = []
            for profile in profiles:
                serializable_profile = {}
                for key, value in profile.items():
                    serializable_profile[key] = convert_to_serializable(value)
                serializable_profiles.append(serializable_profile)
            
            # Convert the profiles to a DataFrame
            profiles_df = pd.DataFrame(serializable_profiles)
            
            # Save to CSV
            profiles_df.to_csv(output_file, index=False)
            print(f"\nSaved {len(profiles)} profiles to {output_file}")
        else:
            print("\nNo profiles were scraped.")

if __name__ == "__main__":
    main()
