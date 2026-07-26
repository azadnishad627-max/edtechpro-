const fs = require('fs');

let adminContent = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

// Add testStartTime and testEndTime state
adminContent = adminContent.replace(
  "const [scheduledTime, setScheduledTime] = useState('');",
  "const [testStartTime, setTestStartTime] = useState('');\n  const [testEndTime, setTestEndTime] = useState('');"
);

// Update clear inputs
adminContent = adminContent.replace(
  "setScheduledTime('');",
  "setTestStartTime('');\n    setTestEndTime('');"
);

// Replace insert statements
adminContent = adminContent.replaceAll(
  "scheduled_time: scheduledTime ? new Date(scheduledTime).toISOString() : null",
  "start_time: testStartTime ? new Date(testStartTime).toISOString() : null, end_time: testEndTime ? new Date(testEndTime).toISOString() : null"
);

// Update UI
const oldInputsHtml = `
            <div className="mb-4">
              <label className="block text-sm mb-1 text-gray-300">Scheduled Time (Optional)</label>
              <input
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="input-field w-full"
                style={{ colorScheme: 'dark' }}
              />
            </div>
`;

const newInputsHtml = `
            <div className="flex gap-4 mb-4">
              <div className="w-1/2">
                <label className="block text-sm mb-1 text-gray-300">Start Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={testStartTime}
                  onChange={(e) => setTestStartTime(e.target.value)}
                  className="input-field w-full"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="w-1/2">
                <label className="block text-sm mb-1 text-gray-300">End Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={testEndTime}
                  onChange={(e) => setTestEndTime(e.target.value)}
                  className="input-field w-full"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>
`;

// Just to be safe with exactly matching whitespace, let's use regex for the UI block
adminContent = adminContent.replace(
  /<div className="mb-4">\s*<label className="block text-sm mb-1 text-gray-300">Scheduled Time \(Optional\)<\/label>\s*<input\s*type="datetime-local"\s*value=\{scheduledTime\}\s*onChange=\{\(e\) => setScheduledTime\(e\.target\.value\)\}\s*className="input-field w-full"\s*style=\{\{ colorScheme: 'dark' \}\}\s*\/>\s*<\/div>/g,
  newInputsHtml
);

fs.writeFileSync('src/app/admin-dashboard/page.js', adminContent, 'utf8');
console.log('Patched Admin Dashboard for Start/End times');
