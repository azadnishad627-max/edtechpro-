const fs = require('fs');

let testContent = fs.readFileSync('src/app/test/[id]/page.js', 'utf8');

// The top part was deleted! We need to add it back and use dynamic import!
const topPart = `"use client";
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import dynamic from 'next/dynamic';

const ProctoringCamera = dynamic(() => import('../../../components/ProctoringCamera'), { ssr: false });

export default function TakeTest() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
`;

// It deleted all of this, so I will prepend it to the file since `const { width, height }` is now at the top
testContent = topPart + testContent;

fs.writeFileSync('src/app/test/[id]/page.js', testContent, 'utf8');
