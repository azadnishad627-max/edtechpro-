import sys
import re

# 1. FIX STUDENT DASHBOARD
with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    student_content = f.read()

# Remove PullToRefresh
student_content = student_content.replace("import PullToRefresh from '../../components/PullToRefresh';\n", "")
student_content = student_content.replace("<PullToRefresh onRefresh={handleRefresh}>\n", "")
student_content = student_content.replace("</PullToRefresh>\n", "")
student_content = student_content.replace("<PullToRefresh onRefresh={handleRefresh}>", "")
student_content = student_content.replace("</PullToRefresh>", "")

# Add refs and back button handler
student_ref_add = """
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    // Push an initial dummy state so we can intercept the first back press
    window.history.pushState({ isDummy: true }, '');

    const handlePopState = (e) => {
      let preventExit = false;
      
      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
        preventExit = true;
      }

      if (preventExit) {
        // Push dummy state again to trap the back button
        window.history.pushState({ isDummy: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
"""
if "window.history.pushState" not in student_content:
    student_content = student_content.replace(
        "const showAdminChatModalRef = useRef(false);",
        "const showAdminChatModalRef = useRef(false);\n" + student_ref_add
    )

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(student_content)
print("Updated student dashboard.")


# 2. FIX ADMIN DASHBOARD
with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    admin_content = f.read()

admin_content = admin_content.replace("import PullToRefresh from '../../components/PullToRefresh';\n", "")
admin_content = admin_content.replace("<PullToRefresh onRefresh={fetchData}>\n", "")
admin_content = admin_content.replace("</PullToRefresh>\n", "")
admin_content = admin_content.replace("<PullToRefresh onRefresh={fetchData}>", "")
admin_content = admin_content.replace("</PullToRefresh>", "")

admin_ref_add = """
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

  useEffect(() => {
    window.history.pushState({ isDummy: true }, '');

    const handlePopState = (e) => {
      let preventExit = false;
      
      if (activeChatStudentIdRef.current) {
        setActiveChatStudentId(null);
        document.body.style.overflow = '';
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
        preventExit = true;
      }

      if (preventExit) {
        window.history.pushState({ isDummy: true }, '');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
"""
if "window.history.pushState" not in admin_content:
    admin_content = admin_content.replace(
        "const activeChatStudentIdRef = useRef(null);",
        "const activeChatStudentIdRef = useRef(null);\n" + admin_ref_add
    )

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(admin_content)
print("Updated admin dashboard.")
