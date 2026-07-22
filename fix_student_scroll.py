import sys
import re

with open('src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any newlines with \s* to ignore line ending issues
target_pattern = r"    useEffect\(\(\) => \{\s*if \(showAdminChatModal && adminChatEndRef\.current\) \{\s*adminChatEndRef\.current\.scrollIntoView\(\{ behavior: 'smooth', block: 'end' \}\);\s*\}\s*\}, \[adminChatHistory\]\);"

replacement = """    const chatLengthRef = useRef(0);
    useEffect(() => {
      if (!showAdminChatModal) chatLengthRef.current = 0;
    }, [showAdminChatModal]);

    useEffect(() => {
      if (showAdminChatModal && adminChatEndRef.current) {
        const currentMsgs = adminChatHistory.filter(m => !m.deleted_for_student);
        if (currentMsgs.length > chatLengthRef.current || chatLengthRef.current === 0) {
          adminChatEndRef.current.scrollIntoView({ behavior: chatLengthRef.current === 0 ? 'auto' : 'smooth', block: 'end' });
          chatLengthRef.current = currentMsgs.length;
        }
      }
    }, [adminChatHistory, showAdminChatModal]);"""

if re.search(target_pattern, content):
    content = re.sub(target_pattern, replacement, content)
    with open('src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced!")
else:
    print("Target not found! Regex failed.")
