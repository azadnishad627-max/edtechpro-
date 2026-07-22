import sys
import re

# 1. FIX STUDENT DASHBOARD
with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    student_content = f.read()

old_student_logic = """
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

new_student_logic = """
  useEffect(() => {
    const handlePopState = (e) => {
      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (activeTab !== 'overview') {
      if (prevTabRef.current === 'overview') {
        window.history.pushState({ tab: activeTab }, '');
      } else {
        window.history.replaceState({ tab: activeTab }, '');
      }
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (showAdminChatModal) {
      window.history.pushState({ modal: 'chat' }, '');
    }
  }, [showAdminChatModal]);
"""
student_content = student_content.replace(old_student_logic, new_student_logic)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(student_content)


# 2. FIX ADMIN DASHBOARD
with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    admin_content = f.read()

old_admin_logic = """
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

new_admin_logic = """
  useEffect(() => {
    const handlePopState = (e) => {
      if (activeChatStudentIdRef.current) {
        setActiveChatStudentId(null);
        document.body.style.overflow = '';
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const prevTabRef = useRef(activeTab);
  useEffect(() => {
    if (activeTab !== 'overview') {
      if (prevTabRef.current === 'overview') {
        window.history.pushState({ tab: activeTab }, '');
      } else {
        window.history.replaceState({ tab: activeTab }, '');
      }
    }
    prevTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (activeChatStudentId) {
      window.history.pushState({ modal: 'chat' }, '');
    }
  }, [activeChatStudentId]);
"""
admin_content = admin_content.replace(old_admin_logic, new_admin_logic)

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(admin_content)

print("Replaced back button logic with pushState on state change instead of dummy trap.")
