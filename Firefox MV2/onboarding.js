// onboarding.js for Quote Rich Text extension
// Shows onboarding or upboarding section based on URL parameters
// © 2025 John Navas. All rights reserved.

const FORCE_UPBOARDING = false;

function getQueryParam(name) {
  if (FORCE_UPBOARDING && name === 'upboarding') return '1';
  const m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
  return m ? decodeURIComponent(m[1]) : null;
}

const upboarding = getQueryParam('upboarding');
const onboardingSection = document.getElementById('onboarding-section');
const upboardingSection = document.getElementById('upboarding-section');

function getExtensionVersion() {
  if (typeof browser !== "undefined" && browser.runtime?.getManifest) {
    return browser.runtime.getManifest().version;
  } else if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version;
  }
  return '';
}

function renderWhatsNew({ title, items }, version) {
  const whatsNewDiv = document.getElementById('whats-new');
  if (!whatsNewDiv) return;

  // Clear previous content
  whatsNewDiv.textContent = '';

  // Title
  const strong = document.createElement('strong');
  strong.textContent = title;
  if (version) {
    const span = document.createElement('span');
    span.className = 'version-number';
    span.textContent = ` v${version}`;
    strong.appendChild(span);
  }
  whatsNewDiv.appendChild(strong);
  whatsNewDiv.appendChild(document.createElement('br'));

  // List
  const ul = document.createElement('ul');
  ul.style.textAlign = 'left';
  ul.style.display = 'inline-block';
  ul.style.margin = '0.3em 0 0.5em 1.2em';
  ul.style.padding = '0';

  for (const item of items) {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  }
  whatsNewDiv.appendChild(ul);
}

function renderWhatsNewFallback(version) {
  renderWhatsNew({
    title: "What's New:",
    items: [
      "Improved quoting reliability",
      "Mobile-friendly onboarding",
      "Privacy-first: No data collected"
    ]
  }, version);
}

if (upboarding) {
  onboardingSection.classList.add('hidden');
  upboardingSection.classList.remove('hidden');
  const version = getExtensionVersion();

  fetch('whats_new.json')
    .then(r => r.json())
    .then(data => renderWhatsNew(data, version))
    .catch(() => renderWhatsNewFallback(version));
} else {
  onboardingSection.classList.remove('hidden');
  upboardingSection.classList.add('hidden');
}

document.getElementById('removeBtn').addEventListener('click', () => {
  window.open('about:addons', '_blank');
});
