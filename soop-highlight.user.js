// ==UserScript==
// @name         숲 댓글 하이라이트 (최종 완성)
// @namespace    http://tampermonkey.net/
// @version      17.0
// @match        *://*.sooplive.com/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';

  let lastUrl = location.href;
  let highlightedOnce = false;

  function isDark() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  function getTextColor() {
    return isDark() ? "#ffffff" : "#2563eb";
  }

  function addButtons() {
    const comments = document.querySelectorAll('[class^="CommentItem_commentInputElement__"]');

    comments.forEach(c => {
      if (c.dataset.highlightAttached === "true") return;

      const cid = Object.entries(c)
        .find(([k]) => k.startsWith("__reactFiber$"))?.[1]
        ?.return?.memoizedProps?.comment?.id;

      if (!cid) return;

      const replyBtn = Array.from(c.querySelectorAll("button, span"))
        .find(el => el.textContent.includes("답글"));

      if (!replyBtn) return;

      const btn = document.createElement("span");
      btn.innerText = "하이라이트";

      Object.assign(btn.style, {
        marginLeft: "8px",
        cursor: "pointer",
        fontSize: window.getComputedStyle(replyBtn).fontSize,
        padding: "6px 14px",
        borderRadius: "999px",
        background: "rgba(255,255,255,0.5)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: getTextColor(),
        fontFamily: "inherit",
        display: "inline-flex",
        alignItems: "center",
        minHeight: window.getComputedStyle(replyBtn).height,
        transition: "all 0.2s cubic-bezier(0.22,1,0.36,1)"
      });

      btn.onclick = async (e) => {
        e.stopPropagation();

        // iOS 클릭 애니메이션
        btn.style.transform = "scale(0.92)";
        btn.style.opacity = "0.7";

        setTimeout(() => {
          btn.style.transform = "scale(1)";
          btn.style.opacity = "1";
        }, 150);

        btn.style.color = getTextColor();

        const url = location.origin + location.pathname + `#comment_noti${cid}`;
        await navigator.clipboard.writeText(url);

        highlightSingleComment(c);

        showToast("복사 완료");
      };

      replyBtn.parentNode.insertBefore(btn, replyBtn.nextSibling);
      c.dataset.highlightAttached = "true";
    });
  }

  function highlightSingleComment(target) {
    // 기존 강조 전부 제거
    document.querySelectorAll('[data-highlighted="true"]').forEach(el => {
      el.dataset.highlighted = "false";
      el.style.background = "";
      el.style.boxShadow = "";
      el.style.transform = "";
    });

    highlightComment(target);
  }

  function highlightComment(el) {
    if (el.dataset.highlighted === "true") return;
    el.dataset.highlighted = "true";

    el.style.transition = "all 0.5s cubic-bezier(0.22,1,0.36,1)";
    el.style.borderRadius = "16px";

    el.style.transform = "scale(1.02)";
    el.style.boxShadow = "0 10px 30px rgba(0,0,0,0.15)";

    el.style.background = isDark()
      ? "rgba(255,255,255,0.08)"
      : "rgba(255,255,255,0.35)";

    el.style.backdropFilter = "blur(10px)";

    setTimeout(() => {
      el.style.transform = "";
      el.style.boxShadow = "";
    }, 2000);
  }

  function autoHighlightFromHash() {
    if (highlightedOnce) return;

    const hash = location.hash;
    if (!hash.includes("comment_noti")) return;

    const cid = hash.replace("#comment_noti", "");

    const comments = document.querySelectorAll('[class^="CommentItem_commentInputElement__"]');

    const target = Array.from(comments).find(c => {
      const currentId = Object.entries(c)
        .find(([k]) => k.startsWith("__reactFiber$"))?.[1]
        ?.return?.memoizedProps?.comment?.id;

      return String(currentId) === cid;
    });

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });

      highlightSingleComment(target);

      highlightedOnce = true;
    }
  }

  function showToast(msg) {
    let toast = document.createElement("div");
    toast.innerText = msg;

    Object.assign(toast.style, {
      position: "fixed",
      top: "20px",
      left: "50%",
      transform: "translateX(-50%) translateY(-20px)",
      background: "rgba(255,255,255,0.75)",
      backdropFilter: "blur(20px)",
      color: "#111",
      padding: "12px 18px",
      borderRadius: "20px",
      zIndex: 9999,
      opacity: "0",
      transition: "all 0.3s ease"
    });

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    }, 10);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.remove();
    }, 2000);
  }

  function init() {
    addButtons();
    autoHighlightFromHash();
  }

  window.addEventListener("load", () => {
    setTimeout(init, 1200);
  });

  setInterval(() => {
    init();

    if (location.href !== lastUrl) {
      lastUrl = location.href;
      highlightedOnce = false;
      setTimeout(init, 1200);
    }
  }, 1500);

})();
