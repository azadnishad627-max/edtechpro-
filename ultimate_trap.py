import sys
import re

# 1. FIX STUDENT DASHBOARD
with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    student_content = f.read()

old_student_logic = """
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

new_student_logic = """
  const trapPushedRef = useRef(false);

  useEffect(() => {
    // Unregister service workers to clear cache for clients that are stuck on old versions
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }

    const pushTrap = () => {
      if (!trapPushedRef.current) {
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      }
    };

    document.addEventListener('click', pushTrap);
    document.addEventListener('touchstart', pushTrap, { passive: true });

    const handlePopState = (e) => {
      trapPushedRef.current = false;

      let preventExit = false;
      
      if (showAdminChatModalRef.current) {
        setShowAdminChatModal(false);
        preventExit = true;
      } else if (activeTabRef.current !== 'overview') {
        setActiveTab('overview');
        preventExit = true;
      }

      if (preventExit) {
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      } else {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', pushTrap);
      document.removeEventListener('touchstart', pushTrap);
    };
  }, []);
"""
student_content = student_content.replace(old_student_logic, new_student_logic)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(student_content)


# 2. FIX ADMIN DASHBOARD
with open(r'src/app/admin-dashboard/page.js', 'r', encoding='utf-8') as f:
    admin_content = f.read()

old_admin_logic = """
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

new_admin_logic = """
  const trapPushedRef = useRef(false);

  useEffect(() => {
    // Unregister service workers to clear cache for clients that are stuck on old versions
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister();
        }
      });
    }

    const pushTrap = () => {
      if (!trapPushedRef.current) {
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      }
    };

    document.addEventListener('click', pushTrap);
    document.addEventListener('touchstart', pushTrap, { passive: true });

    const handlePopState = (e) => {
      trapPushedRef.current = false;

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
        window.history.pushState({ trap: true }, '');
        trapPushedRef.current = true;
      } else {
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', pushTrap);
      document.removeEventListener('touchstart', pushTrap);
    };
  }, []);
"""
admin_content = admin_content.replace(old_admin_logic, new_admin_logic)

with open(r'src/app/admin-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(admin_content)

print("Replaced hash logic with ultimate trap logic.")
