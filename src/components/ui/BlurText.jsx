import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const BlurText = ({ text, className, delay = 0 }) => {
  const words = text.split(' ');

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {words.map((word, idx) => (
        <motion.span
          key={idx}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 20 }}
          animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
          transition={{
            duration: 0.8,
            delay: delay + idx * 0.1,
            ease: [0.2, 0.65, 0.3, 0.9],
          }}
          className="inline-block"
        >
          {word}
        </motion.span>
      ))}
    </div>
  );
};

export default BlurText;
