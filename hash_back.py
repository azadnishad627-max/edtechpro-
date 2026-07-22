import sys
import re

# 1. FIX STUDENT DASHBOARD
with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    student_content = f.read()

old_student_logic = """
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

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

new_student_logic = """
  useEffect(() => {
    if (showAdminChatModal) {
      if (window.location.hash !== '#chat') window.location.hash = 'chat';
    } else {
      const targetHash = `#${activeTab}`;
      if (window.location.hash !== targetHash) {
        if (window.location.hash === '' && activeTab === 'overview') {
          window.history.replaceState(null, null, '#overview');
        } else {
          window.location.hash = activeTab;
        }
      }
    }
  }, [activeTab, showAdminChatModal]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'chat') {
        // chat modal opened via forward button, theoretically possible, let it be handled by state if needed
      } else if (hash) {
        setShowAdminChatModal(false);
        setActiveTab(hash);
      } else {
        setShowAdminChatModal(false);
        setActiveTab('overview');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
"""
student_content = student_content.replace(old_student_logic, new_student_logic)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(student_content)


# 2. FIX ADMIN DASHBOARD
with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    admin_content = f.read()

old_admin_logic = """
  const activeTabRef = useRef(activeTab);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

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

new_admin_logic = """
  useEffect(() => {
    if (activeChatStudentId) {
      if (window.location.hash !== '#chat') window.location.hash = 'chat';
    } else {
      const targetHash = `#${activeTab}`;
      if (window.location.hash !== targetHash) {
        if (window.location.hash === '' && activeTab === 'overview') {
          window.history.replaceState(null, null, '#overview');
        } else {
          window.location.hash = activeTab;
        }
      }
    }
  }, [activeTab, activeChatStudentId]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'chat') {
        // do nothing
      } else if (hash) {
        setActiveChatStudentId(null);
        document.body.style.overflow = '';
        setActiveTab(hash);
      } else {
        setActiveChatStudentId(null);
        document.body.style.overflow = '';
        setActiveTab('overview');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);
"""
admin_content = admin_content.replace(old_admin_logic, new_admin_logic)

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(admin_content)

print("Replaced popstate logic with bulletproof hashchange logic.")
