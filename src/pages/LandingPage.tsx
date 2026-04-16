/** @jsxImportSource theme-ui */
import { motion } from 'framer-motion'
import { Check, Target, BarChart3, Sparkles, Rocket } from 'lucide-react'
import Navbar from '../components/Navbar'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
     const navigate = useNavigate()

  return (
    <>
      <Navbar />

      {/* BLUE SECTION - Ends after feature cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        sx={{
          background: `
          linear-gradient(
          180deg,
          rgba(79, 195, 255, 0.82) 0%,
          #1FA4FF 8%,
          #0A8AE6 22%,
          #005FC2 48%,
          #004A9E 100%
          )`,
          color: '#FFFFFF',
          fontFamily: 'body',
          pb: [5, 6]
        }}
      >
        {/* Header */}
        <header sx={{ py: [4, 5], px: [3, 4], textAlign: 'center', }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              sx={{
                pt: [20, 24, 76],
                fontSize: [4, 5, 6],
                fontWeight: '600',
                opacity: 0.95,
                maxWidth: '800px',
                mx: 'auto',
                mb: 3
              }}
            >
              Organize • Track • Achieve
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              sx={{
                fontSize: [3, 4],
                opacity: 0.9,
                maxWidth: '900px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Your all-in-one productivity companion for tasks and goals.
            </motion.p>
          </motion.div>
        </header>

        {/* Feature Cards */}
        <main sx={{ px: [3, 4] }}>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            sx={{
              display: 'flex',
              flexDirection: ['column', 'row'],
              justifyContent: 'center',
              gap: [4, 5],
              maxWidth: '1000px',
              mx: 'auto'
            }}
          >
            {[
              { icon: Check, title: 'Tasks', desc: 'Manage daily activities', bgColor: '#10B981', iconColor: 'white' },
              { icon: Target, title: 'Goals', desc: 'Track long-term objectives', bgColor: '#F59E0B', iconColor: 'white' },
              { icon: BarChart3, title: 'Stats', desc: 'Visualize productivity', bgColor: '#8B5CF6', iconColor: 'white' }
            ].map((item, index) => (
              <motion.div
              key={item.title}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: [1, 1.03, 1],
                opacity: 1
              }}
              transition={{
                scale: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                },
                opacity: { duration: 0.5, delay: 0.1 + index * 0.1 }
              }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              sx={{

                  background: 'surface',
                  borderRadius: '20px',
                  p: [4, 5],
                  textAlign: 'center',
                  flex: 1,
                  minWidth: ['auto', '200px'],
                  cursor: 'pointer'
                }}
              >
                <div sx={{
                  background: item.bgColor,
                  color: item.iconColor,
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3
                }}>
                  <item.icon size={28} />
                </div>
                <h3 sx={{ fontSize: [3, 4], mb: 2, fontWeight: '600', color: 'text' }}>{item.title}</h3>
                <p sx={{ opacity: 0.9, fontSize: [1, 2], color: 'muted' }}>{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </main>
      </motion.div>

      {/* WHITE SECTION - Everything below */}
      <div sx={{ background: 'surface', py: [5, 6], px: [3, 4] }}>
        {/* Features List */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          sx={{
            color: 'text',
            borderRadius: '24px',
            p: [4, 5],
            maxWidth: '800px',
            mx: 'auto',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
            background: 'surface'
          }}
        >
          <div sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <Sparkles color="#3B82F6" />
            <h2 sx={{ fontSize: [4, 5], fontWeight: 'bold', m: 0 }}>✨ Features</h2>
          </div>

          <div sx={{ display: 'grid', gap: 4 }}>
            {[
              {
                icon: Check,
                title: 'Task Management',
                features: ['Create, edit, organize', 'Due dates & priorities']
              },
              {
                icon: Target,
                title: 'Goal Tracking',
                features: ['Set milestones', 'Track progress visually']
              },
              {
                icon: BarChart3,
                title: 'Productivity Insights',
                features: ['Charts & analytics', 'Streaks & achievements']
              }
            ].map((section, idx) => (
              <motion.div
                key={section.title}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                sx={{ mb: idx < 2 ? 4 : 0 }}
              >
                <div sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                  <div sx={{
                    background: '#3B82F6',
                    color: '#FFFFFF',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    mt: 1
                  }}>
                    <section.icon size={20} />
                  </div>
                  <div>
                    <h3 sx={{ fontSize: [3, 4], mb: 2, fontWeight: '600' }}>{section.title}</h3>
                    <ul sx={{ listStyle: 'none', pl: 0, m: 0 }}>
                      {section.features.map((feature, i) => (
                        <li key={i} sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          mb: 1,
                          fontSize: [1, 2]
                        }}>
                          <div sx={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#3B82F6'
                          }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            sx={{
              mt: 5,
              pt: 4,
              borderTop: '1px solid',
              borderColor: 'border',
              textAlign: 'center'
            }}
          >
            <p sx={{ fontSize: [1, 2], color: 'muted', mb: 3 }}>Built with</p>
            <div sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: [3, 4],
              flexWrap: 'wrap'
            }}>
              {['React ⚛️', 'TypeScript 📘', 'Theme UI 🎨', 'Vite ⚡'].map((tech, i) => (
                <motion.span
                  key={tech}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.1, type: 'spring' }}
                  sx={{
                    background: 'surfaceAlt',
                    px: 3,
                    py: 2,
                    borderRadius: '12px',
                    fontWeight: '500',
                    fontSize: [1, 2]
                  }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          sx={{ textAlign: 'center', mt: [5, 6] }}
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/signup')}
            sx={{
              background: '#FBBF24',
              color: '#78350F',
              border: 'none',
              fontSize: [3, 4],
              fontWeight: '600',
              px: [5, 6],
              py: [3, 4],
              borderRadius: '16px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              ':hover': {
                boxShadow: '0 15px 40px rgba(0, 0, 0, 0.25)',
                background: '#F59E0B',
              }
            }}
          >
            <Rocket size={24} />
            Start Organizing →
          </motion.button>
        </motion.div>

        {/* Footer */}
        <footer sx={{
          py: 4,
          textAlign: 'center',
          opacity: 0.8,
          fontSize: [0, 1],
          color: 'muted'
        }}>
          <p>Your productivity journey starts here</p>
        </footer>
      </div>
    </>
  )
}

export default LandingPage
