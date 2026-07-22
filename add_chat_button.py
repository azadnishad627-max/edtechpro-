import sys
import re

with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The script previously failed to add the action button to the student list table rows.
# I will replace it using regex to handle variations in the td styling.

# 1. Update table header if it wasn't updated
if "Action</th>" not in content:
    content = re.sub(
        r'(<th[^>]*>Joined Date</th>\s*</tr>)',
        r'<th style={{ padding: \'1rem\', color: \'var(--text-secondary-dark)\' }}>Joined Date</th>\n                    <th style={{ padding: \'1rem\', color: \'var(--text-secondary-dark)\', textAlign: \'right\' }}>Action</th>\n                  </tr>',
        content
    )

# 2. Update the rows
if "💬 Chat" not in content:
    content = re.sub(
        r'(<td[^>]*>\{new Date\(student\.created_at\)\.toLocaleDateString\(\)\}</td[^>]*>\s*</tr[^>]*>)',
        r'\1\n'.replace(r'\1', '<td style={{ padding: \'1rem\' }}>{new Date(student.created_at).toLocaleDateString()}</td>\n                      <td style={{ padding: \'1rem\', textAlign: \'right\' }}>\n                        <button \n                          onClick={() => { setActiveTab(\'admin_chats\'); setActiveChatStudentId(student.id); document.body.style.overflow = \'hidden\'; }}\n                          className="btn-primary" \n                          style={{ padding: \'0.4rem 0.8rem\', fontSize: \'0.85rem\', display: \'inline-flex\', alignItems: \'center\', gap: \'0.4rem\' }}\n                        >\n                          💬 Chat\n                        </button>\n                      </td>\n                    </tr>'),
        content
    )
    
    # Actually the above regex replace might be messy. Let's do a direct replace.
    old_row = "                        <td style={{ padding: '1rem' }}>{new Date(student.created_at).toLocaleDateString()}</td>\n                      </tr>"
    new_row = """                        <td style={{ padding: '1rem' }}>{new Date(student.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <button 
                            onClick={() => { setActiveTab('admin_chats'); setActiveChatStudentId(student.id); document.body.style.overflow = 'hidden'; }}
                            className="btn-primary" 
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            💬 Chat
                          </button>
                        </td>
                      </tr>"""
    content = content.replace(old_row, new_row)


with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Added Chat button to student list.")
