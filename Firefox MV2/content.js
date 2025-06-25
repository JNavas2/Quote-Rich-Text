// Content script for Quote Rich Text browser extension
// Expands selection to Gmail-style paragraph blocks, block-level elements, or full text nodes for valid HTML quoting.
// Uses execCommand('insertHTML') for undo support.
// Shows a toast error if there is no selection.
// © 2025 John Navas. All rights reserved.

// --- Helpers ---

const BLOCK_TAGS = new Set([
  "P", "DIV", "LI", "UL", "OL", "BLOCKQUOTE", "PRE", "TABLE",
  "H1", "H2", "H3", "H4", "H5", "H6", "ARTICLE", "SECTION", "ASIDE", "NAV"
]);

const isBlockElement = node =>
  node && node.nodeType === 1 && BLOCK_TAGS.has(node.nodeName);

const isGmailParagraphDiv = node =>
  node &&
  node.nodeType === 1 &&
  node.nodeName === "DIV" &&
  node.classList.contains("gmail_default") &&
  node.textContent.trim() !== "";

function findGmailParagraphDivAncestor(node) {
  while (node && node.nodeType === 1) {
    if (
      node.classList.contains("gmail_default") &&
      node.parentNode &&
      node.parentNode.nodeType === 1 &&
      node.parentNode.classList.contains("gmail_default")
    ) return node;
    node = node.parentNode;
  }
  return null;
}

function expandRangeToGmailParagraphs(range) {
  const startDiv = findGmailParagraphDivAncestor(range.startContainer);
  const endDiv = findGmailParagraphDivAncestor(range.endContainer);
  if (!startDiv || !endDiv || startDiv.parentNode !== endDiv.parentNode) return false;
  const children = Array.from(startDiv.parentNode.children);
  const [startIdx, endIdx] = [children.indexOf(startDiv), children.indexOf(endDiv)].sort((a, b) => a - b);

  let first = null, last = null;
  for (let i = startIdx; i <= endIdx; ++i) {
    if (isGmailParagraphDiv(children[i])) {
      if (!first) first = children[i];
      last = children[i];
    }
  }
  if (first && last) {
    range.setStartBefore(first);
    range.setEndAfter(last);
    return true;
  }
  return false;
}

function getBlockAncestor(node) {
  while (node && node.nodeType === 1 && !isBlockElement(node)) node = node.parentNode;
  return node && node.nodeType === 1 && isBlockElement(node) ? node : null;
}

function expandRangeToBlockBoundaries(range) {
  if (expandRangeToGmailParagraphs(range)) return;

  const startBlock = getBlockAncestor(range.startContainer);
  const endBlock = getBlockAncestor(range.endContainer);

  if (startBlock && endBlock && startBlock === endBlock) {
    range.setStartBefore(startBlock);
    range.setEndAfter(endBlock);
    return;
  }
  if (startBlock) range.setStartBefore(startBlock);
  if (endBlock) range.setEndAfter(endBlock);

  // If no block ancestor, expand to the whole text node
  if (!startBlock && range.startContainer.nodeType === 3)
    range.setStart(range.startContainer, 0);
  if (!endBlock && range.endContainer.nodeType === 3)
    range.setEnd(range.endContainer, range.endContainer.length);
}

function showToastError(message) {
  if (document.getElementById('qrt-toast-error')) return;
  const toast = Object.assign(document.createElement('div'), {
    id: 'qrt-toast-error',
    textContent: message
  });
  Object.assign(toast.style, {
    position: 'fixed',
    left: '50%',
    bottom: '2em',
    transform: 'translateX(-50%)',
    background: 'rgba(220, 53, 69, 0.98)',
    color: '#fff',
    padding: '0.7em 1.5em',
    borderRadius: '0.7em',
    fontSize: '1.05em',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    zIndex: 2147483647,
    fontFamily: 'system-ui, sans-serif',
    pointerEvents: 'none'
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.4s';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 2200);
}

function isEditable(node) {
  while (node && node.nodeType !== 1) node = node.parentNode;
  return node && (node.isContentEditable || node.nodeName === "TEXTAREA" || node.nodeName === "INPUT");
}

// --- Main logic ---

function wrapSelectionWithBlockquote() {
  const sel = window.getSelection();
  if (!sel.rangeCount || sel.isCollapsed) return showToastError('No editable text selected!');
  const range = sel.getRangeAt(0);
  if (!isEditable(range.commonAncestorContainer)) return showToastError('No editable text selected!');

  expandRangeToBlockBoundaries(range);

  // Prepare blockquote HTML
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(range.cloneContents());
  const html = `<blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex;">${tempDiv.innerHTML}</blockquote>`;

  // Replace selection with blockquote using execCommand (undo-friendly)
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand('insertHTML', false, html);
}

// --- Listen for messages from background ---

const runtime =
  (typeof browser !== "undefined" && browser.runtime) ? browser.runtime :
  (typeof chrome !== "undefined" && chrome.runtime) ? chrome.runtime : null;

if (runtime && runtime.onMessage) {
  runtime.onMessage.addListener(msg => {
    if (msg.action === "quote") wrapSelectionWithBlockquote();
  });
}
