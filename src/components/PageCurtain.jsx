import { motion } from 'motion/react'

function PageCurtain() {
  return (
    <motion.div
      className="page-curtain"
      initial={{ y: '-100%' }}
      animate={{
        y: ['-100%', '0%', '0%', '-100%'],
      }}
      transition={{
        duration: 1.15,
        times: [0, 0.36, 0.58, 1],
        ease: [0.76, 0, 0.24, 1],
      }}
      aria-hidden="true"
    >
      <div className="page-curtain-brand">
        <span>NAMA</span>
        <small>MARINE</small>
      </div>
    </motion.div>
  )
}

export default PageCurtain