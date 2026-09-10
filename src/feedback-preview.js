// Small progressive-enhancement layer for fast preview iterations.
// It only handles browser behavior that sits on top of the React settings UI.
const themeFromButton = (button) => {
  const swatch = button?.querySelector('.theme-swatch')
  if (!swatch) return null
  return ['green', 'blue', 'pink', 'yellow', 'purple', 'beige'].find(t => swatch.classList.contains(t)) || null
}

document.addEventListener('click', (event) => {
  const themeButton = event.target.closest('.theme-card')
  if (themeButton) {
    const theme = themeFromButton(themeButton)
    if (theme) document.documentElement.dataset.theme = theme
  }
})
