const fs = require('fs');
const path = require('path');
const os = require('os');

const desktopPath = path.join(os.homedir(), 'Desktop');

const scienceCSV = fs.readFileSync(path.join(desktopPath, 'Science_Tough_30_Questions.csv'), 'utf8');
const socialScienceCSV = fs.readFileSync(path.join(desktopPath, 'Social_Science_Tough_30_Questions.csv'), 'utf8');

// Get all lines of social science and remove the first line (header)
const socialScienceLines = socialScienceCSV.split('\n');
socialScienceLines.shift(); // remove header
const socialScienceContent = socialScienceLines.join('\n');

const combinedCSV = scienceCSV + '\n' + socialScienceContent;

fs.writeFileSync(path.join(desktopPath, 'Combined_Science_SSt_60_Questions.csv'), combinedCSV, 'utf8');
console.log('Combined CSV generated');
