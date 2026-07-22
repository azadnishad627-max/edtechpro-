const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Insert the back button logic just after `const [activeTab, setActiveTab] = useState(...);`
  const stateRegex = /const \[activeTab, setActiveTab\] = useState\((.*?)\);/g;
  let match = stateRegex.exec(content);
  
  if (match) {
    const defaultTabStr = match[1]; // e.g. "'overview'"
    
    const insertion = `
  const switchTab = (tab) => {
    window.history.pushState({ tab }, '', '#' + tab);
    setActiveTab(tab);
  };

  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
      } else {
        const hashTab = window.location.hash.replace('#', '');
        if (hashTab) {
          setActiveTab(hashTab);
        } else {
          setActiveTab(${defaultTabStr});
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    
    const hashTab = window.location.hash.replace('#', '');
    if (hashTab) {
      setActiveTab(hashTab);
    } else {
      window.history.replaceState({ tab: ${defaultTabStr} }, '', '#' + ${defaultTabStr}.replace(/['"]/g, ''));
    }
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);
`;
    // Insert after the match
    const insertPos = match.index + match[0].length;
    content = content.slice(0, insertPos) + '\n' + insertion + content.slice(insertPos);
    
    // Replace all `setActiveTab(` with `switchTab(` EXCEPT where it's inside `const [activeTab, setActiveTab] = useState`
    // Actually, I just inserted switchTab and useEffect, which contain setActiveTab. 
    // It's safer to only replace onClick={() => setActiveTab(
    content = content.replace(/setActiveTab\(/g, 'switchTab(');
    
    // But now I must revert the `switchTab` calls that are inside the insertion itself and state declaration!
    content = content.replace('const [activeTab, switchTab] = useState', 'const [activeTab, setActiveTab] = useState');
    content = content.replace('switchTab(tab);', 'setActiveTab(tab);');
    content = content.replace('switchTab(e.state.tab);', 'setActiveTab(e.state.tab);');
    content = content.replace('switchTab(hashTab);', 'setActiveTab(hashTab);');
    content = content.replace('switchTab(' + defaultTabStr + ');', 'setActiveTab(' + defaultTabStr + ');');
    
    // Sometimes there's a logout logic doing setActiveTab('overview') before router.push('/')
    // Those can safely be switchTab.
    
    fs.writeFileSync(filepath, content, 'utf8');
    console.log('Patched back button logic in ' + filepath);
  }
}

patchFile('src/app/admin-dashboard/page.js');
patchFile('src/app/student-dashboard/page.js');
