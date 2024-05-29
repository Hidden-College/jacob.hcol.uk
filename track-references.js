import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

// Paths
const trackedCollectionsPath = 'tracked-collections.txt';
const zoteroDir = path.resolve(process.env.HOME, 'Zotero');
const orgFilesDir = path.resolve(process.env.HOME, 'Orgfiles', 'roam');
const outputPath = '_data/trackedReferences.json';
const outputPath_c = '_data/trackedCollections.json'; 

// Fancy startup message
console.log(chalk.green('Starting the reference tracking process...\n'));

// Ensure tracked-collections.txt exists
if (!fs.existsSync(trackedCollectionsPath)) {
  console.warn(chalk.yellow(`${trackedCollectionsPath} does not exist. Creating a blank file.`));
  fs.writeFileSync(trackedCollectionsPath, '');
}

// Read tracked collections
console.log(chalk.cyan('Reading tracked collections...'));
const trackedCollections = fs.readFileSync(trackedCollectionsPath, 'utf-8').split('\n').filter(Boolean);
console.log(chalk.green(`Found ${trackedCollections.length} collections to track.\n`));

// Get Zotero reference files
console.log(chalk.cyan('Finding Zotero reference files...'));
let referenceFiles = glob.sync(`${zoteroDir}/References-*.json`);
console.log(chalk.green(`Found ${referenceFiles.length} reference files.\n`));

// Filter reference files to only include those that contain a tracked collection in their name
referenceFiles = referenceFiles.filter(file => {
  const fileName = path.basename(file);
  return trackedCollections.some(collection => fileName.includes(collection));
});
console.log(chalk.green(`Filtered to ${referenceFiles.length} relevant reference files.\n`));

// Function to parse JSON file
const parseJsonFile = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

// Function to get citekeys from references
const getCitekeys = (references) => {
  return references.map(ref => ref['citation-key']);
};

// Function to generate collection paths
const generateCollectionPaths = (baseName) => {
  const parts = baseName.split('-');
  const paths = parts.map((_, index) => parts.slice(0, index + 1).join('/'));
  return paths;
};

// Compile list of citekeys
console.log(chalk.cyan('Compiling list of citekeys...'));
let citekeys = [];
let referencesMap = {}; // Map to store references by citekey for quick lookup
let collectionsMap = {}; // Map to store collections by citekey

referenceFiles.forEach(file => {
  const baseName = path.basename(file).replace(/^References-/, '').replace(/\.json$/, '');
  const collections = generateCollectionPaths(baseName);
  console.log(chalk.blue(`Processing file: ${file}`));
  const references = parseJsonFile(file);
  references.forEach(ref => {
    citekeys.push(ref['citation-key']);
    referencesMap[ref['citation-key']] = ref;
    collectionsMap[ref['citation-key']] = collections;
  });
});
console.log(chalk.green(`Compiled ${citekeys.length} citekeys.\n`));

const convertToPercentage = (input) => {
  // Helper function to check if a number is within 0 to 100
  const isValidPercentage = (num) => {
      return num >= 0 && num <= 100;
  };

  // Check if input is empty or not a string
  if (!input || typeof input !== 'string') {
      return 0;
  }

  // Try to split the input by the slash '/'
  let parts = input.split('/');
  
  // If input is a fraction of the form A/B
  if (parts.length === 2) {
      let numerator = parseFloat(parts[0]);
      let denominator = parseFloat(parts[1]);
      
      // If either part is NaN or the denominator is zero, return 0
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
          return 0;
      }
      
      // Calculate the percentage
      let percentage = (numerator / denominator) * 100;
      
      // Return the valid percentage or 0 if out of bounds
      let number = isValidPercentage(percentage) ? percentage : 0;
      return Math.floor(number);
  }

  // If input is a single number A
  let number = parseFloat(input);
  
  // If number is NaN or not within 1 to 100, return 0
  if (isNaN(number) || !isValidPercentage(number)) {
      return 0;
  }

  return Math.floor(number);
};

// Function to extract TRACKER_PROGRESS from org file
const getTrackerProgress = (orgFilePath) => {
  if (!fs.existsSync(orgFilePath)) {
    console.log(chalk.yellow(`There is no such orgfile as ${orgFilePath}`));
    return 0;
  }
  const content = fs.readFileSync(orgFilePath, 'utf-8');
  const match = content.match(/TRACKER_PROGRESS:\s*(\S+)/);
  if (match) {
    return convertToPercentage(match[1]);
  } else {
    return 0;
  }
};

const getTrackerPublished = (orgFilePath) => {
  if (!fs.existsSync(orgFilePath)) {
    return false;
  }
  const content = fs.readFileSync(orgFilePath, 'utf-8');
  const match = content.match(/TRACKER_PUBLISHED:\s*(\S+)/);
  if (match && match[1] == 'YES') {
    return true;
  } else {
    return false;
  }
};

// Generate tracked-references.json
console.log(chalk.cyan('Generating trackedReferences.json...'));
let trackedReferences = [];

citekeys.forEach(citekey => {
  if (!trackedReferences.some(reference => reference.citekey === citekey)) {
    const orgFilePath = path.join(orgFilesDir, `${citekey}.org`);
    const trackerProgress = getTrackerProgress(orgFilePath);
    const trackerPublished = getTrackerPublished(orgFilePath);
    const reference = referencesMap[citekey];
    const collections = collectionsMap[citekey];
    trackedReferences.push({ ...reference, citekey: citekey, tracker_progress: trackerProgress, tracker_published: trackerPublished, collection: collections });
    console.log(chalk.blue(`Processed citekey: ${citekey}, TRACKER_PROGRESS: ${trackerProgress}, TRACKER_PUBLISHED: ${trackerPublished}, COLLECTIONS: ${collections.join(', ')}`));
  }
});

fs.writeFileSync(outputPath, JSON.stringify(trackedReferences, null, 2));
console.log(chalk.green(`\nTracked references have been written to ${outputPath}`));


// Extract all collections and flatten the array of arrays
let collections = trackedReferences.flatMap(item => item.collection);
// Create a Set to filter unique collections
let uniqueCollections = [...new Set(collections), 'All'];
// Output the result to trackedCollections.json
fs.writeFileSync(outputPath_c, JSON.stringify(uniqueCollections, null, 2));

console.log(chalk.green(`\nTracked [unique] collections have been written to ${outputPath_c}`));

console.log(chalk.cyan('Reference tracking process completed successfully.'));
