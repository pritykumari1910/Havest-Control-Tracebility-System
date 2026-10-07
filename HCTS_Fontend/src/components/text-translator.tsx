import { useEffect } from "react";
import { useLang } from "@/i18n";
import { EN_ES, ES_EN } from "@/i18n/phrases";

/**
 * Walks the document text nodes and swaps EN <-> ES using the phrase dictionary.
 * Only trimmed exact matches are translated to avoid partial-word collisions.
 * Skips form fields, script/style, and any element marked with data-no-translate.
 */
export function TextTranslator() {
  const { lang } = useLang();

  useEffect(() => {
    if (typeof document === "undefined") return;

    const dict = lang === "es" ? EN_ES : ES_EN;

    const SKIP_TAGS = new Set([
      "SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "CODE", "PRE",
      "SVG", "PATH", "CANVAS",
    ]);

    const shouldSkip = (el: Element | null): boolean => {
      let cur: Element | null = el;
      while (cur) {
        if (SKIP_TAGS.has(cur.tagName)) return true;
        if ((cur as HTMLElement).dataset && (cur as HTMLElement).dataset.noTranslate === "true") return true;
        if (cur.getAttribute && cur.getAttribute("contenteditable") === "true") return true;
        cur = cur.parentElement;
      }
      return false;
    };

    const translateText = (raw: string): string | null => {
      // Preserve leading/trailing whitespace
      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const hit = dict[trimmed];
      if (hit && hit !== trimmed) return leading + hit + trailing;
      return null;
    };

    const walkAndTranslate = (root: Node) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (shouldSkip(node.parentElement)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes: Text[] = [];
      let n: Node | null = walker.nextNode();
      while (n) {
        nodes.push(n as Text);
        n = walker.nextNode();
      }
      for (const t of nodes) {
        const next = translateText(t.nodeValue ?? "");
        if (next !== null && next !== t.nodeValue) t.nodeValue = next;
      }
    };

    // Also translate select attributes commonly holding user-visible text
    const translateAttrs = (root: ParentNode) => {
      const els = root.querySelectorAll<HTMLElement>("[placeholder], [aria-label], [title]");
      els.forEach((el) => {
        if (shouldSkip(el)) return;
        for (const attr of ["placeholder", "aria-label", "title"] as const) {
          const v = el.getAttribute(attr);
          if (!v) continue;
          const trimmed = v.trim();
          const hit = dict[trimmed];
          if (hit && hit !== trimmed) el.setAttribute(attr, v.replace(trimmed, hit));
        }
      });
    };

    walkAndTranslate(document.body);
    translateAttrs(document.body);

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === "characterData" && m.target.nodeType === Node.TEXT_NODE) {
          if (shouldSkip((m.target as Text).parentElement)) continue;
          const next = translateText((m.target as Text).nodeValue ?? "");
          if (next !== null) (m.target as Text).nodeValue = next;
        } else if (m.type === "childList") {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === Node.TEXT_NODE) {
              if (shouldSkip((n as Text).parentElement)) return;
              const next = translateText((n as Text).nodeValue ?? "");
              if (next !== null) (n as Text).nodeValue = next;
            } else if (n.nodeType === Node.ELEMENT_NODE) {
              walkAndTranslate(n);
              translateAttrs(n as Element);
            }
          });
        } else if (m.type === "attributes" && m.target.nodeType === Node.ELEMENT_NODE) {
          const el = m.target as HTMLElement;
          const attr = m.attributeName;
          if (!attr || !["placeholder", "aria-label", "title"].includes(attr)) return;
          const v = el.getAttribute(attr);
          if (!v) return;
          const trimmed = v.trim();
          const hit = dict[trimmed];
          if (hit && hit !== trimmed) el.setAttribute(attr, v.replace(trimmed, hit));
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["placeholder", "aria-label", "title"],
    });

    return () => observer.disconnect();
  }, [lang]);

  return null;
}
