"use client";

import { useRef, useEffect } from "react";

export default function CommentBox() {
  const commentBox: React.RefObject<HTMLDivElement> =
    useRef<HTMLDivElement>(null);

  // Add comments script with Utterances.
  // Note rendered twice because of strict mode in development
  useEffect(() => {
    const commentScript = document.createElement("script");
    // Optional: It is possible to use light/dark themes in the comment box
    const theme = "github-light";
    commentScript.async = true;
    commentScript.src = "https://utteranc.es/client.js";
    commentScript.setAttribute("repo", "r-bt/richardbt.com-issues");
    commentScript.setAttribute("issue-term", "pathname");
    commentScript.setAttribute("id", "utterances");
    commentScript.setAttribute("theme", theme);
    commentScript.setAttribute("crossorigin", "anonymous");
    if (commentBox && commentBox.current) {
      commentBox.current.appendChild(commentScript);
    } else {
      console.error(`Error adding utterances comments on: ${commentBox}`);
    }
  }, []);

  return <div ref={commentBox} />;
}
