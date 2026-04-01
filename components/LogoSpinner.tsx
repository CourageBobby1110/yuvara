"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function LogoSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full">
      <div className="relative w-24 h-24">
        {/* Pulsing background effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gray-100"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Rotating ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-t-2 border-black"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-full shadow-sm overflow-hidden p-3">
           <Image 
             src="/icon-v2.svg"
             alt="YuVara"
             width={60}
             height={60}
             style={{ objectFit: "contain" }}
           />
        </div>
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 text-sm font-medium text-gray-500 uppercase tracking-widest"
      >
        Loading
      </motion.p>
    </div>
  );
}
