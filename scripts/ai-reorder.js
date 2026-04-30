#!/usr/bin/env node

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const nodemailer = require('nodemailer');

async function sendReorderEmail(items) {
  // Simple console log for demo
  console.log('📧 Email sent:', items.map(i => `${i.ProductName}: ${i.ReorderQty}`).join(', '));
}

async function main() {
  try {
    const response = await fetch('http://localhost:3000/api/ai/reorder?days=14');
    const predictions = await response.json();
    const urgent = predictions.urgent || [];
    
    if (urgent.length > 0) {
      await sendReorderEmail(urgent);
      console.log(`✅ Reorder alert for ${urgent.length} items`);
    } else {
      console.log('✅ No reorders needed');
    }
  } catch (error) {
    console.error('❌ AI Reorder failed:', error);
  }
}

main();

