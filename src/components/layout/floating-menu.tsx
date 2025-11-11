'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Repeat, Coins, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';

interface FloatingMenuProps {
  onRoutinesClick?: () => void;
  onCreditsClick?: () => void;
  onTutorialsClick?: () => void;
  onCollabsClick?: () => void;
}

export function FloatingMenu({
  onRoutinesClick,
  onCreditsClick,
  onTutorialsClick,
  onCollabsClick,
}: FloatingMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleRoutines = () => {
    if (onRoutinesClick) {
      onRoutinesClick();
    } else {
      router.push('/tasks/routines');
    }
    setIsOpen(false);
  };

  const handleCredits = () => {
    if (onCreditsClick) {
      onCreditsClick();
    }
    setIsOpen(false);
  };

  const handleTutorials = () => {
    if (onTutorialsClick) {
      onTutorialsClick();
    }
    setIsOpen(false);
  };

  const handleCollabs = () => {
    if (onCollabsClick) {
      onCollabsClick();
    } else {
      router.push('/collabs');
    }
    setIsOpen(false);
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="fixed bottom-24 right-6 z-50 sm:bottom-6"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <MoreVertical className="h-6 w-6 text-white" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-gray-900 border-gray-700"
        >
          <DropdownMenuItem
            onClick={handleRoutines}
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <Repeat className="mr-2 h-4 w-4 text-blue-400" />
            <div className="flex flex-col">
              <span className="font-medium">Daily Routines</span>
              <span className="text-xs text-gray-400">
                Manage recurring tasks
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={handleCredits}
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <Coins className="mr-2 h-4 w-4 text-yellow-400" />
            <div className="flex flex-col">
              <span className="font-medium">Credits</span>
              <span className="text-xs text-gray-400">
                View your rewards
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={handleTutorials}
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <GraduationCap className="mr-2 h-4 w-4 text-green-400" />
            <div className="flex flex-col">
              <span className="font-medium">Tutorials</span>
              <span className="text-xs text-gray-400">
                Learn how to use Lunchbox
              </span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-gray-700" />
          <DropdownMenuItem
            onClick={handleCollabs}
            className="cursor-pointer hover:bg-gray-800 focus:bg-gray-800"
          >
            <Users className="mr-2 h-4 w-4 text-indigo-400" />
            <div className="flex flex-col">
              <span className="font-medium">Collabs</span>
              <span className="text-xs text-gray-400">
                Collaborate with others
              </span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.div>
  );
}

