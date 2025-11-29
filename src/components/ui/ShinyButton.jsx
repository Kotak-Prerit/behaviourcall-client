import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const ShinyButton = ({ children, onClick, className, disabled, ...props }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative px-8 py-3 rounded-xl font-semibold text-white overflow-hidden group",
        "bg-gradient-to-br from-purple-600 to-blue-600",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
};

export default ShinyButton;
