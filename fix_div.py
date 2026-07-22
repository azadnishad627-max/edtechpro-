import sys

with open(r'src/app/student-dashboard/page.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove the trailing </div> at the end of the file
content = content.replace(
"""      )}

      </div>
    </>
  );
}""",
"""      )}

    </>
  );
}"""
)

# 2. Add </div> right before </PullToRefresh>
content = content.replace(
"""      </div>

    </PullToRefresh>""",
"""      </div>
      </div>
    </PullToRefresh>"""
)

with open(r'src/app/student-dashboard/page.js', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
