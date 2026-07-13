// This app has no react-router - App.jsx switches pages via a single
// `activePage` state, driven by a global `navigate` CustomEvent that
// Navbar/BottomNavbar dispatch. Use this helper anywhere you'd normally
// reach for useNavigate(), so every component uses the same pattern.
//
// Usage:
//   goToPage('profile')
//   goToPage('artistProfile', { artistId: '64f...' })
export const goToPage = (page, extra = {}) => {
  window.dispatchEvent(new CustomEvent('navigate', { detail: { page, ...extra } }));
};