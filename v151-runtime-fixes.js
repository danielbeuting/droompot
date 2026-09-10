(() => {
  const params = new URLSearchParams(window.location.search)

  function openDreamDirectly(attempt = 0) {
    if (params.get('view') !== 'dream') return
    if (typeof show === 'function') {
      show('home')
      return
    }
    if (attempt < 40) setTimeout(() => openDreamDirectly(attempt + 1), 75)
  }

  // Beheer links use ?view=dream so they land directly on the Droompot,
  // not on the public chooser screen. app.js is injected asynchronously by
  // the Supabase bootstrap, so retry briefly until the v1.5.1 show() exists.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => openDreamDirectly(), { once: true })
  } else {
    openDreamDirectly()
  }

  const successScreen = document.getElementById('screen-success')
  const confettiCanvas = document.getElementById('confetti-canvas')
  if (successScreen && confettiCanvas && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(() => {
      if (successScreen.classList.contains('active') && typeof startConfetti === 'function') {
        startConfetti()
        confettiCanvas.classList.remove('confetti-fade')
        confettiCanvas.classList.add('confetti-visible')
        setTimeout(() => confettiCanvas.classList.add('confetti-fade'), 3200)
        setTimeout(() => {
          if (typeof stopConfetti === 'function') stopConfetti()
          confettiCanvas.classList.remove('confetti-visible', 'confetti-fade')
        }, 4100)
      }
    })
    observer.observe(successScreen, { attributes: true, attributeFilter: ['class'] })
  }

  // Override the transition from the success page so the v1.5.1 goal animation
  // always runs after "Bekijk de Droompot". This avoids timing/race issues
  // introduced by loading the public state from Supabase before app.js starts.
  const backHome = document.getElementById('back-home-btn')
  if (backHome) {
    backHome.addEventListener('click', event => {
      if (typeof lastDonationAnimation === 'undefined' || !lastDonationAnimation) return
      event.preventDefault()
      event.stopImmediatePropagation()

      if (typeof stopConfetti === 'function') stopConfetti()
      const anim = lastDonationAnimation
      lastDonationAnimation = null

      const giverName = document.getElementById('giver-name')
      const giverMessage = document.getElementById('giver-message')
      const customAmount = document.getElementById('custom-amount')
      const donationPreview = document.getElementById('donation-photo-preview')
      const donationInput = document.getElementById('donation-photo-upload')
      if (giverName) giverName.value = ''
      if (giverMessage) giverMessage.value = ''
      if (customAmount) customAmount.value = ''
      if (typeof donationPhotoData !== 'undefined') donationPhotoData = ''
      if (donationPreview) donationPreview.innerHTML = '<span>+</span>'
      if (donationInput) donationInput.value = ''
      if (typeof setAmount === 'function') setAmount(20)

      if (typeof state !== 'undefined') {
        state.activeGoal = anim.goalIndex
        if (typeof save === 'function') save()
      }
      if (typeof render === 'function') render()
      if (typeof show === 'function') show('home')

      setTimeout(() => {
        if (typeof runDonationHomeAnimation === 'function') runDonationHomeAnimation(anim)
      }, 180)
    }, true)
  }
})()
