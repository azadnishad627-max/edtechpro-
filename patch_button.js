const fs = require('fs');
let content = fs.readFileSync('src/app/admin-dashboard/page.js', 'utf8');

const replacement = `                        <button 
                          onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                          className="btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}
                        >
                          \uD83D\uDCAC Chat
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)}
                          className="btn-outline" 
                          style={{ border: '1px solid #ff4444', color: '#ff4444', padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          title="Delete Student"
                        >
                          \uD83D\uDDD1\uFE0F Delete
                        </button>
                      </td>`;

// Let's find the td that contains the chat button
const lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('setActiveChatStudentId(student.id)')) {
        // We found the chat button line, let's look for the closing td
        for (let j = i; j < i + 10; j++) {
            if (lines[j].includes('</td>')) {
                // Replace from i-1 (the <button line) to j
                let oldChunk = lines.slice(i-1, j+1).join('\n');
                content = content.replace(oldChunk, replacement);
                break;
            }
        }
        break;
    }
}

fs.writeFileSync('src/app/admin-dashboard/page.js', content, 'utf8');
