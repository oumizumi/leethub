/**
 * popup.js - Extension popup logic (STUB)
 * TODO: Implement status display and manual push button
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Load and display current settings
  const settings = await chrome.storage.local.get(['githubOwner', 'githubRepo', 'githubBranch']);
  
  const repoSpan = document.getElementById('repo');
  if (settings.githubOwner && settings.githubRepo) {
    repoSpan.textContent = `${settings.githubOwner}/${settings.githubRepo} (${settings.githubBranch || 'main'})`;
  }
  
  // TODO: Implement manual push button
  document.getElementById('pushButton').addEventListener('click', () => {
    alert('Manual push not yet implemented - coming soon!');
  });
});

