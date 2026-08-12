import { useEffect } from 'react'
import { inView } from 'motion'

const revealSelector = [
  '[data-reveal]',
  'main h1',
  'main h2',
  'main h3',
  'main p',
  'main img',
  'main article',
  'main form',
  'main .nama-center-link',
  'main .nama-text-link',
  'main .boat-detail-capacity',
].join(', ')

function ScrollReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll(revealSelector),
    )

    if (elements.length === 0) {
      return undefined
    }

    elements.forEach((element, index) => {
      const tagName = element.tagName.toLowerCase()

      let direction = element.dataset.reveal

      if (!direction) {
        direction = tagName.startsWith('h') ? 'down' : 'up'
      }

      element.classList.add('auto-reveal')
      element.dataset.revealDirection = direction

      if (tagName === 'img') {
        element.classList.add('auto-reveal-image')
      }

      element.style.setProperty(
        '--reveal-delay',
        `${(index % 4) * 65}ms`,
      )
    })

    const stopDetection = inView(
      elements,
      (element) => {
        element.classList.add('is-revealed')

        return () => {
          element.classList.remove('is-revealed')
        }
      },
      {
        amount: 0.12,
        margin: '0px 0px -8% 0px',
      },
    )

    return () => {
      stopDetection()
    }
  }, [])

  return null
}

export default ScrollReveal