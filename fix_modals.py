import sys

with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Extract the showAdminChatModal block
start_tag = "{showAdminChatModal && ("
# We know it ends exactly before {activeTab === 'more' && (
end_tag = "        {activeTab === 'more' && ("

start_idx = content.find(start_tag)
end_idx = content.find(end_tag)

if start_idx != -1 and end_idx != -1:
    chat_modal_code = content[start_idx:end_idx]
    # Remove it from the original location
    content = content[:start_idx] + content[end_idx:]

    # 2. Add <></> around the return block
    content = content.replace(
        """  return (
    <PullToRefresh onRefresh={handleRefresh}>""",
        """  return (
    <>
      <PullToRefresh onRefresh={handleRefresh}>"""
    )

    # 3. Insert chat_modal_code, Announcements, etc. OUTSIDE PullToRefresh
    content = content.replace(
        """      {/* Notifications Modal */}""",
        """    </PullToRefresh>\n\n""" + chat_modal_code + """\n      {/* Notifications Modal */}"""
    )

    # 4. Remove the trailing </PullToRefresh> and close fragment
    content = content.replace(
        """      </div>
    </PullToRefresh>
  );
}""",
        """      </div>
    </>
  );
}"""
    )

    with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Updated successfully")
else:
    print("Could not find markers")
